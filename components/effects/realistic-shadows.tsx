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

import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function RealisticShadowMarketplace({ tint }) {
    return (
        <motion.div
            style={{
                margin: 50,
                width: 100,
                height: 100,
                borderRadius: 5,
                backgroundColor: tint,
            }}
            animate={{ scale: 1.5 }}
            whileHover={{ rotate: 90 }}
        />
    )
}

addPropertyControls(RealisticShadowMarketplace, {
    tint: {
        title: "Tint",
        type: ControlType.Color,
        defaultValue: "rgba(150,150,150,0.15)",
    },
})
