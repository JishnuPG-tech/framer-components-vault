import { useEffect, useRef } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function MagneticEffect(props) {
    const {
        mode = "classic",
        distance = 12,
        stiffness = 180,
        damping = 18,
        mass = 0.1,
        children,
        style,
        ...rest
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springConfig = { stiffness, damping, mass }
    const springX = useSpring(x, springConfig)
    const springY = useSpring(y, springConfig)

    useEffect(() => {
        // Fix #2: Skip listeners entirely in static/canvas/export contexts
        if (isStatic) return

        const el = ref.current
        if (!el) return

        let isInViewport = false

        const handleMouseMove = (e: MouseEvent) => {
            // Fix #3: Only run when element is in viewport
            if (!isInViewport) return

            const rect = el.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const deltaX = e.clientX - centerX
            const deltaY = e.clientY - centerY
            const angle = Math.atan2(deltaY, deltaX)
            const sign = mode === "inverted" ? -1 : 1

            x.set(sign * Math.cos(angle) * distance)
            y.set(sign * Math.sin(angle) * distance)
        }

        const handleMouseLeave = () => {
            x.set(0)
            y.set(0)
        }

        // Fix #3: IntersectionObserver to pause effect when out of view
        const observer = new IntersectionObserver(
            ([entry]) => {
                isInViewport = entry.isIntersecting
                if (!entry.isIntersecting) {
                    x.set(0)
                    y.set(0)
                }
            },
            { threshold: 0 }
        )

        observer.observe(el)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            observer.disconnect()
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [isStatic, mode, distance, x, y])

    return (
        <motion.div
            ref={ref}
            style={{
                ...style,
                x: springX,
                y: springY,
                width: "100%",
                height: "100%",
            }}
            {...rest}
        >
            {children}
        </motion.div>
    )
}

addPropertyControls(MagneticEffect, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["classic", "inverted"],
        optionTitles: ["Attract", "Repel"],
        defaultValue: "classic",
    },
    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 12,
        displayStepper: true,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 50,
        max: 400,
        step: 10,
        defaultValue: 180,
        displayStepper: true,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 18,
        displayStepper: true,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 0.1,
        displayStepper: true,
    },
})
