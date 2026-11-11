// SolarGrid Pro - Professional solar energy solutions component with animated panels, 
// energy statistics, savings calculator, performance dashboard, and smooth micro-interactions.
// Features clean modern aesthetic, responsive layouts, and customizable sections for solar 
// installation companies and renewable energy providers.

import { useState, useEffect, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface SolarGridProProps {
    // Content
    title: string
    subtitle: string
    energyProduced: number
    energyUnit: string
    co2Saved: number
    co2Unit: string
    moneySaved: number
    currency: string
    panelCount: number
    efficiency: number
    
    // Colors
    backgroundColor: string
    primaryColor: string
    accentColor: string
    textColor: string
    cardBackground: string
    
    // Typography
    titleFont: any
    subtitleFont: any
    statFont: any
    labelFont: any
    
    // Layout
    showAnimation: boolean
    animationSpeed: number
    showCalculator: boolean
    
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SolarGridPro(props: SolarGridProProps) {
    const {
        title,
        subtitle,
        energyProduced,
        energyUnit,
        co2Saved,
        co2Unit,
        moneySaved,
        currency,
        panelCount,
        efficiency,
        backgroundColor,
        primaryColor,
        accentColor,
        textColor,
        cardBackground,
        titleFont,
        subtitleFont,
        statFont,
        labelFont,
        showAnimation,
        animationSpeed,
        showCalculator,
    } = props

    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.2 })
    
    const [activePanel, setActivePanel] = useState(0)
    const [calculatorValue, setCalculatorValue] = useState(100)
    const [calculatorResult, setCalculatorResult] = useState({
        energy: 0,
        savings: 0,
        co2: 0
    })

    // Animate through panels
    useEffect(() => {
        if (!showAnimation || !isInView) return
        
        const interval = setInterval(() => {
            startTransition(() => {
                setActivePanel(prev => (prev + 1) % panelCount)
            })
        }, 3000 / animationSpeed)
        
        return () => clearInterval(interval)
    }, [showAnimation, animationSpeed, panelCount, isInView])

    // Calculate savings based on input
    useEffect(() => {
        const energyPerPanel = energyProduced / panelCount
        const savingsPerPanel = moneySaved / panelCount
        const co2PerPanel = co2Saved / panelCount
        
        startTransition(() => {
            setCalculatorResult({
                energy: energyPerPanel * calculatorValue,
                savings: savingsPerPanel * calculatorValue,
                co2: co2PerPanel * calculatorValue
            })
        })
    }, [calculatorValue, energyProduced, moneySaved, co2Saved, panelCount])

    const stats = useMemo(() => [
        {
            value: energyProduced.toLocaleString(),
            unit: energyUnit,
            label: "Energy Produced",
            icon: "⚡"
        },
        {
            value: co2Saved.toLocaleString(),
            unit: co2Unit,
            label: "CO₂ Saved",
            icon: "🌱"
        },
        {
            value: moneySaved.toLocaleString(),
            unit: currency,
            label: "Money Saved",
            icon: "💰"
        },
        {
            value: efficiency,
            unit: "%",
            label: "Efficiency",
            icon: "📊"
        }
    ], [energyProduced, energyUnit, co2Saved, co2Unit, moneySaved, currency, efficiency])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                width: props.style?.width || "100%",
                height: props.style?.height || "100%",
                backgroundColor,
                padding: "60px 40px",
                display: "flex",
                flexDirection: "column",
                gap: "48px",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                style={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        color: textColor,
                        ...titleFont
                    }}
                >
                    {title}
                </h1>
                <p
                    style={{
                        margin: 0,
                        color: textColor,
                        opacity: 0.8,
                        ...subtitleFont
                    }}
                >
                    {subtitle}
                </p>
            </motion.div>

            {/* Solar Panel Grid */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.min(panelCount, 8)}, 1fr)`,
                    gap: "12px",
                    padding: "32px",
                    backgroundColor: cardBackground,
                    borderRadius: "16px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
                }}
            >
                {Array.from({ length: panelCount }).map((_, index) => (
                    <motion.div
                        key={index}
                        animate={{
                            backgroundColor: activePanel === index ? accentColor : primaryColor,
                            scale: activePanel === index ? 1.05 : 1
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                            aspectRatio: "1",
                            borderRadius: "8px",
                            position: "relative",
                            overflow: "hidden",
                            cursor: "pointer"
                        }}
                        onClick={() => startTransition(() => setActivePanel(index))}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Panel grid pattern */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gridTemplateRows: "repeat(3, 1fr)",
                                gap: "2px",
                                padding: "4px"
                            }}
                        >
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.1)",
                                        borderRadius: "2px"
                                    }}
                                />
                            ))}
                        </div>
                        
                        {/* Energy pulse effect */}
                        {showAnimation && activePanel === index && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0, 1.5] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "8px",
                                    border: `2px solid ${accentColor}`,
                                    pointerEvents: "none"
                                }}
                            />
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Statistics Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px"
                }}
            >
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
                        style={{
                            backgroundColor: cardBackground,
                            padding: "24px",
                            borderRadius: "12px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "box-shadow 0.3s ease"
                        }}
                    >
                        <div style={{ fontSize: "32px" }}>{stat.icon}</div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px"
                            }}
                        >
                            <span
                                style={{
                                    color: primaryColor,
                                    ...statFont
                                }}
                            >
                                {stat.value}
                            </span>
                            <span
                                style={{
                                    color: textColor,
                                    opacity: 0.6,
                                    ...labelFont
                                }}
                            >
                                {stat.unit}
                            </span>
                        </div>
                        <span
                            style={{
                                color: textColor,
                                opacity: 0.7,
                                ...labelFont
                            }}
                        >
                            {stat.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Savings Calculator */}
            {showCalculator && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    style={{
                        backgroundColor: cardBackground,
                        padding: "32px",
                        borderRadius: "16px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px"
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            color: textColor,
                            ...titleFont,
                            fontSize: "24px"
                        }}
                    >
                        Calculate Your Savings
                    </h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: textColor, ...labelFont }}>
                                Number of Panels: {calculatorValue}
                            </span>
                        </div>
                        
                        <input
                            type="range"
                            min="1"
                            max={panelCount * 2}
                            value={calculatorValue}
                            onChange={(e) => startTransition(() => setCalculatorValue(Number(e.target.value)))}
                            style={{
                                width: "100%",
                                height: "8px",
                                borderRadius: "4px",
                                outline: "none",
                                background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${(calculatorValue / (panelCount * 2)) * 100}%, #E0E0E0 ${(calculatorValue / (panelCount * 2)) * 100}%, #E0E0E0 100%)`,
                                cursor: "pointer",
                                WebkitAppearance: "none",
                                appearance: "none"
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "16px",
                            paddingTop: "16px",
                            borderTop: `1px solid ${textColor}20`
                        }}
                    >
                        <div>
                            <div style={{ color: textColor, opacity: 0.6, ...labelFont, marginBottom: "4px" }}>
                                Energy Production
                            </div>
                            <div style={{ color: primaryColor, ...statFont, fontSize: "20px" }}>
                                {calculatorResult.energy.toFixed(0)} {energyUnit}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: textColor, opacity: 0.6, ...labelFont, marginBottom: "4px" }}>
                                Annual Savings
                            </div>
                            <div style={{ color: primaryColor, ...statFont, fontSize: "20px" }}>
                                {currency}{calculatorResult.savings.toFixed(0)}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: textColor, opacity: 0.6, ...labelFont, marginBottom: "4px" }}>
                                CO₂ Reduction
                            </div>
                            <div style={{ color: primaryColor, ...statFont, fontSize: "20px" }}>
                                {calculatorResult.co2.toFixed(0)} {co2Unit}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Performance Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    padding: "16px",
                    backgroundColor: cardBackground,
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
                }}
            >
                <div
                    style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: accentColor,
                        boxShadow: `0 0 12px ${accentColor}`
                    }}
                />
                <span style={{ color: textColor, ...labelFont }}>
                    System Operating at {efficiency}% Efficiency
                </span>
            </motion.div>
        </div>
    )
}

addPropertyControls(SolarGridPro, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Solar Energy Solutions"
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Powering a sustainable future with clean, renewable energy"
    },
    energyProduced: {
        type: ControlType.Number,
        title: "Energy Produced",
        defaultValue: 45000,
        min: 0,
        step: 1000
    },
    energyUnit: {
        type: ControlType.String,
        title: "Energy Unit",
        defaultValue: "kWh/year"
    },
    co2Saved: {
        type: ControlType.Number,
        title: "CO₂ Saved",
        defaultValue: 32000,
        min: 0,
        step: 1000
    },
    co2Unit: {
        type: ControlType.String,
        title: "CO₂ Unit",
        defaultValue: "kg/year"
    },
    moneySaved: {
        type: ControlType.Number,
        title: "Money Saved",
        defaultValue: 12500,
        min: 0,
        step: 100
    },
    currency: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "$"
    },
    panelCount: {
        type: ControlType.Number,
        title: "Panel Count",
        defaultValue: 24,
        min: 4,
        max: 64,
        step: 1
    },
    efficiency: {
        type: ControlType.Number,
        title: "Efficiency",
        defaultValue: 94,
        min: 0,
        max: 100,
        step: 1,
        unit: "%"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5"
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#0099FF"
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#00CC66"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000"
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF"
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em"
        }
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em"
        }
    },
    statFont: {
        type: ControlType.Font,
        title: "Stat Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em"
        }
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em"
        }
    },
    showAnimation: {
        type: ControlType.Boolean,
        title: "Show Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        hidden: ({ showAnimation }) => !showAnimation
    },
    showCalculator: {
        type: ControlType.Boolean,
        title: "Show Calculator",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide"
    }
})
