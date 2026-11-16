import { useRef, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation, type Transition } from "framer-motion"

interface DontTouchMeProps {
    children?: React.ReactNode
    eventType: "hover" | "click"
    transition: Transition
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerIntrinsicWidth 160
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicHeight 36
 */
export default function DontTouchMe(props: DontTouchMeProps) {
    const { children, eventType, transition, style } = props
    const isStatic = useIsStaticRenderer()
    const controls = useAnimation()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const isAnimating = useRef(false)

    const stableTransition = useMemo(
        () => transition,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(transition)]
    )

    const moveToRandomPosition = useCallback(() => {
        if (!containerRef.current || typeof window === "undefined") return
        if (isAnimating.current) return

        const element = containerRef.current
        const rect = element.getBoundingClientRect()
        // Use clientWidth/Height instead of window.innerWidth/Height so the
        // scrollbar's own width isn't counted as usable viewport space.
        const viewportWidth = document.documentElement.clientWidth
        const viewportHeight = document.documentElement.clientHeight

        // Clamp to 0 in case the element is larger than the viewport,
        // which would otherwise make maxX/maxY negative.
        const maxX = Math.max(0, viewportWidth - rect.width)
        const maxY = Math.max(0, viewportHeight - rect.height)

        const randomX = Math.min(maxX, Math.max(0, Math.random() * maxX))
        const randomY = Math.min(maxY, Math.max(0, Math.random() * maxY))

        // Derive offset relative to current position
        const targetX = randomX - rect.left
        const targetY = randomY - rect.top

        isAnimating.current = true
        controls
            .start({
                x: targetX,
                y: targetY,
                transition: stableTransition,
            })
            .then(() => {
                isAnimating.current = false
            })
    }, [controls, stableTransition])

    // Disable interactive/animated behavior entirely when rendered
    // statically (Framer canvas thumbnails, image export, etc.)
    const eventHandlers = isStatic
        ? {}
        : eventType === "hover"
          ? { onHoverStart: moveToRandomPosition }
          : { onTap: moveToRandomPosition }

    return (
        <motion.div
            ref={containerRef}
            {...eventHandlers}
            style={{
                width: "100%",
                height: "100%",
                cursor: "pointer",
                ...style,
            }}
            animate={isStatic ? undefined : controls}
        >
            {children}
        </motion.div>
    )
}

addPropertyControls(DontTouchMe, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Target",
    },
    eventType: {
        type: ControlType.Enum,
        title: "Event Type",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Animation",
        defaultValue: {
            type: "spring",
            stiffness: 300,
            damping: 25,
        },
        description:
            "See more component from [Iklil Najma M](https://dub.sh/artevo)",
    },
})

DontTouchMe.displayName = "Dont Touch Me"
