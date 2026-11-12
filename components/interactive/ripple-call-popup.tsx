// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function RippleCallPopup(props) {
    const {
        tint,
        phoneNumber,
        buttonSize,
        iconColor,
        iconSize,
        shadowIntensity,
    } = props

    const getShadow = () => {
        const shadows = {
            none: "none",
            light: "0 2px 10px rgba(0,0,0,0.15)",
            medium: "0 4px 20px rgba(0,0,0,0.3)",
            strong: "0 6px 30px rgba(0,0,0,0.45)",
        }
        return shadows[shadowIntensity]
    }

    return (
        <motion.div
            style={{
                position: "relative",
                cursor: "pointer",
                userSelect: "none",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
                if (phoneNumber) {
                    window.open(`tel:${phoneNumber}`, "_self")
                }
            }}
        >
            {/* Main Call Button */}
            <motion.div
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: "50%",
                    backgroundColor: tint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: getShadow(),
                    position: "relative",
                    zIndex: 2,
                }}
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {/* Phone Icon */}
                <motion.svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 24 24"
                    fill={iconColor}
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                    animate={{
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </motion.svg>
            </motion.div>

            {/* Ripple Effect */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: "50%",
                    border: `2px solid ${tint}`,
                    zIndex: 1,
                }}
                animate={{
                    scale: [1, 1.8],
                    opacity: [0.7, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                }}
            />

            {/* Second Ripple Effect */}
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: "50%",
                    border: `2px solid ${tint}`,
                    zIndex: 1,
                }}
                animate={{
                    scale: [1, 1.8],
                    opacity: [0.7, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1,
                }}
            />

            {/* Call Now Text */}
            <motion.div
                style={{
                    position: "absolute",
                    left: buttonSize + 15,
                    top: "50%",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0,0,0,0.8)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                    zIndex: 3,
                }}
                initial={{ opacity: 0, x: -10, scale: 0.9 }}
                whileHover={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                    duration: 0.2,
                    ease: "easeOut",
                }}
            >
                Call Now
                {/* Arrow pointer */}
                <div
                    style={{
                        transform: "translateY(-50%)",
                        width: 0,
                        height: 0,
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        borderRight: "8px solid rgba(0,0,0,0.8)",
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(RippleCallPopup, {
    tint: {
        title: "Button Color",
        type: ControlType.Color,
        defaultValue: "#00C851",
    },
    phoneNumber: {
        title: "Phone Number",
        type: ControlType.String,
        defaultValue: "+1234567890",
        placeholder: "Enter phone number",
    },
    buttonSize: {
        title: "Button Size",
        type: ControlType.Number,
        defaultValue: 60,
        min: 40,
        max: 100,
        step: 5,
        unit: "px",
        displayStepper: true,
    },
    iconColor: {
        title: "Icon Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    iconSize: {
        title: "Icon Size",
        type: ControlType.Number,
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    shadowIntensity: {
        title: "Shadow",
        type: ControlType.Enum,
        options: ["none", "light", "medium", "strong"],
        optionTitles: ["None", "Light", "Medium", "Strong"],
        defaultValue: "medium",
    },
})
