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


// --- STYLES ---
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center", // FIXED: Ensures vertical centering if height grows
    padding: "30px",
    borderRadius: "24px",
    boxShadow: "0px 10px 40px rgba(0,0,0,0.08)",
    width: "100%",
    maxWidth: "400px",
    minWidth: "280px", // FIXED: Prevents the card from getting too thin and breaking layout
    boxSizing: "border-box",
    backgroundColor: "#FFF", // Default fallback
}

const toggleRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    fontSize: 14,
    fontWeight: 500,
    padding: "8px 16px",
    background: "rgba(0,0,0,0.03)",
    borderRadius: "50px",
    width: "fit-content", // FIXED: Ensures the background pill wraps tight around content
    maxWidth: "100%", // Safety
}

const serviceRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontSize: 14,
    fontWeight: 500,
}

export default function SaasPricing(props) {
    // Safety Defaults
    const {
        topTitle = "ESTIMATED COST",
        pricePerUser = 15,
        discountPercent = 20,
        minUsers = 1,
        maxUsers = 100,
        unitLabel = "Active Users",
        bgColor = "#FFF",
        textColor = "#111",
        accentColor = "#0066FF",
        font = "Inter",
    } = props

    // State Logic
    const [count, setCount] = React.useState(Math.max(10, minUsers))
    const [isYearly, setIsYearly] = React.useState(false)
    const [addService1, setAddService1] = React.useState(false)
    const [addService2, setAddService2] = React.useState(false)

    // Sync State with Props
    React.useEffect(() => {
        if (count < minUsers) setCount(minUsers)
        if (count > maxUsers) setCount(maxUsers)
    }, [minUsers, maxUsers])

    // Calc Logic
    const baseCost = count * pricePerUser
    const servicesCost =
        (addService1 ? props.service1Price : 0) +
        (addService2 ? props.service2Price : 0)
    const discountMultiplier = isYearly ? 1 - discountPercent / 100 : 1
    const totalRaw = (baseCost + servicesCost) * discountMultiplier
    const finalPrice = Math.round(totalRaw)

    return (
        <div
            style={{
                ...containerStyle,
                backgroundColor: bgColor,
                color: textColor,
                fontFamily: font,
            }}
        >
            {/* 1. Billing Cycle Toggle */}
            <div style={toggleRowStyle}>
                <span
                    style={{
                        opacity: isYearly ? 0.5 : 1,
                        whiteSpace: "nowrap",
                    }}
                >
                    Monthly
                </span>

                {/* TOGGLE SWITCH TRACK */}
                <div
                    onClick={() => setIsYearly(!isYearly)}
                    style={{
                        width: 44,
                        minWidth: 44, // FIXED: Force width
                        height: 24,
                        borderRadius: 99,
                        backgroundColor: isYearly ? accentColor : "#ddd",
                        position: "relative",
                        cursor: "pointer",
                        margin: "0 10px",
                        transition: "0.2s",
                        flexShrink: 0, // FIXED: Prevents squishing on mobile
                    }}
                >
                    {/* TOGGLE CIRCLE */}
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            backgroundColor: "white",
                            position: "absolute",
                            top: 2,
                            left: isYearly ? 22 : 2,
                            transition:
                                "0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Nice bounce effect
                            boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
                        }}
                    />
                </div>

                <span
                    style={{
                        opacity: isYearly ? 1 : 0.5,
                        whiteSpace: "nowrap",
                    }}
                >
                    Yearly{" "}
                    <span
                        style={{
                            color: accentColor,
                            fontSize: 10,
                            fontWeight: "bold",
                            marginLeft: 2,
                        }}
                    >
                        (-{discountPercent}%)
                    </span>
                </span>
            </div>

            {/* 2. Header / Total */}
            <div
                style={{ textAlign: "center", marginBottom: 30, width: "100%" }}
            >
                <span
                    style={{
                        fontSize: 12,
                        letterSpacing: "1px",
                        opacity: 0.6,
                        textTransform: "uppercase",
                        fontWeight: 600,
                        display: "block",
                        marginBottom: 4,
                    }}
                >
                    {topTitle}
                </span>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                    }}
                >
                    <h1
                        style={{
                            fontSize: 48,
                            margin: 0,
                            fontWeight: 800,
                            lineHeight: 1,
                        }}
                    >
                        ${finalPrice}
                    </h1>
                    <span
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            opacity: 0.6,
                            marginTop: 12,
                        }}
                    >
                        /mo
                    </span>
                </div>

                <div style={{ height: 20 }}>
                    {isYearly && (
                        <span
                            style={{
                                fontSize: 12,
                                color: accentColor,
                                fontWeight: 600,
                            }}
                        >
                            billed yearly
                        </span>
                    )}
                </div>
            </div>

            {/* 3. Slider Section */}
            <div style={{ width: "100%", marginBottom: 30 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    <span>{unitLabel}</span>
                    <span style={{ color: accentColor }}>{count}</span>
                </div>
                <input
                    type="range"
                    min={minUsers}
                    max={maxUsers}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    style={{
                        width: "100%",
                        accentColor: accentColor,
                        cursor: "pointer",
                        height: 6,
                        borderRadius: 10,
                    }}
                />
            </div>

            {/* 4. Add-on Services */}
            <div
                style={{
                    width: "100%",
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    paddingTop: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                }}
            >
                {props.enableService1 && (
                    <div style={serviceRowStyle}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                gap: "10px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={addService1}
                                onChange={() => setAddService1(!addService1)}
                                style={{
                                    accentColor: accentColor,
                                    width: 18,
                                    height: 18,
                                    cursor: "pointer",
                                }}
                            />
                            {props.service1Name}
                        </label>
                        <span style={{ fontWeight: 600 }}>
                            +${props.service1Price}
                        </span>
                    </div>
                )}

                {props.enableService2 && (
                    <div style={serviceRowStyle}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                gap: "10px",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={addService2}
                                onChange={() => setAddService2(!addService2)}
                                style={{
                                    accentColor: accentColor,
                                    width: 18,
                                    height: 18,
                                    cursor: "pointer",
                                }}
                            />
                            {props.service2Name}
                        </label>
                        <span style={{ fontWeight: 600 }}>
                            +${props.service2Price}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- CONTROLS ---
addPropertyControls(SaasPricing, {
    // Styling
    topTitle: {
        type: ControlType.String,
        title: "Top Title",
        defaultValue: "ESTIMATED COST",
    },
    font: { type: ControlType.String, title: "Font", defaultValue: "Inter" },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0066FF",
    },

    // Core Logic
    unitLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Active Users",
    },
    pricePerUser: {
        type: ControlType.Number,
        title: "$ Per User",
        defaultValue: 15,
    },
    minUsers: {
        type: ControlType.Number,
        title: "Min Users",
        defaultValue: 1,
    },
    maxUsers: {
        type: ControlType.Number,
        title: "Max Users",
        defaultValue: 100,
    },
    discountPercent: {
        type: ControlType.Number,
        title: "Yearly % Off",
        defaultValue: 20,
        min: 0,
        max: 100,
    },

    // Services
    enableService1: {
        type: ControlType.Boolean,
        title: "Show Add-on 1",
        defaultValue: true,
    },
    service1Name: {
        type: ControlType.String,
        title: "Name 1",
        defaultValue: "Priority Support",
        hidden: (p) => !p.enableService1,
    },
    service1Price: {
        type: ControlType.Number,
        title: "Price 1",
        defaultValue: 99,
        hidden: (p) => !p.enableService1,
    },

    enableService2: {
        type: ControlType.Boolean,
        title: "Show Add-on 2",
        defaultValue: true,
    },
    service2Name: {
        type: ControlType.String,
        title: "Name 2",
        defaultValue: "Advanced Analytics",
        hidden: (p) => !p.enableService2,
    },
    service2Price: {
        type: ControlType.Number,
        title: "Price 2",
        defaultValue: 49,
        hidden: (p) => !p.enableService2,
    },
})
