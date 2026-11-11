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

export default function ScrollArrow(props) {
    const { color, size } = props

    return (
        <motion.div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: size,
                height: size,
                cursor: "default",
            }}
            animate={{ y: [0, 16, -4, 0] }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: 0.4,
                times: [0, 0.6, 0.8, 1],
                ease: "easeInOut",
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill={color}
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M12 19L2 7h20L12 19z" />
            </svg>
        </motion.div>
    )
}

ScrollArrow.defaultProps = {
    color: "#000000",
    size: 40,
}

addPropertyControls(ScrollArrow, {
    color: {
        type: ControlType.Color,
        title: "Colour",
        defaultValue: "#000000",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 40,
        min: 16,
        max: 120,
        step: 4,
        displayStepper: true,
    },
})
