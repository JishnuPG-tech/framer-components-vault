// 3D Cube component with six customizable image sides and scroll-based rotation animation
// Each face can have a different image set via property controls
// Rotates in 3D space based on scroll position with realistic perspective

import { useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useScroll, useTransform, motion } from "framer-motion"

interface CubeProps {
    topImage: { src: string; alt: string }
    bottomImage: { src: string; alt: string }
    frontImage: { src: string; alt: string }
    backImage: { src: string; alt: string }
    leftImage: { src: string; alt: string }
    rightImage: { src: string; alt: string }
    cubeSize: number
    perspective: number
    rotationSpeed: number
    initialRotationX: number
    initialRotationY: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Cube3D(props: CubeProps) {
    const {
        topImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Top",
        },
        bottomImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Bottom",
        },
        frontImage = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Front",
        },
        backImage = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Back",
        },
        leftImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Left",
        },
        rightImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Right",
        },
        cubeSize = 200,
        perspective = 1000,
        rotationSpeed = 1,
        initialRotationX = -25,
        initialRotationY = 25,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const rotateX = useTransform(
        scrollYProgress,
        [0, 1],
        [initialRotationX, 360 * rotationSpeed + initialRotationX]
    )
    const rotateY = useTransform(
        scrollYProgress,
        [0, 1],
        [initialRotationY, 360 * rotationSpeed + initialRotationY]
    )

    const halfSize = cubeSize / 2

    const faceStyle = {
        position: "absolute" as const,
        width: cubeSize,
        height: cubeSize,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backfaceVisibility: "hidden" as const,
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${perspective}px`,
                position: "relative",
            }}
        >
            <motion.div
                style={{
                    width: cubeSize,
                    height: cubeSize,
                    position: "relative",
                    transformStyle: "preserve-3d",
                    rotateX: isStatic ? initialRotationX : rotateX,
                    rotateY: isStatic ? initialRotationY : rotateY,
                }}
            >
                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${frontImage.src})`,
                        transform: `translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={frontImage.alt}
                />

                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${backImage.src})`,
                        transform: `rotateY(180deg) translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={backImage.alt}
                />

                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${leftImage.src})`,
                        transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={leftImage.alt}
                />

                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${rightImage.src})`,
                        transform: `rotateY(90deg) translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={rightImage.alt}
                />

                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${topImage.src})`,
                        transform: `rotateX(90deg) translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={topImage.alt}
                />

                <div
                    style={{
                        ...faceStyle,
                        backgroundImage: `url(${bottomImage.src})`,
                        transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
                    }}
                    role="img"
                    aria-label={bottomImage.alt}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(Cube3D, {
    frontImage: {
        type: ControlType.ResponsiveImage,
        title: "Front Image",
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back Image",
    },
    leftImage: {
        type: ControlType.ResponsiveImage,
        title: "Left Image",
    },
    rightImage: {
        type: ControlType.ResponsiveImage,
        title: "Right Image",
    },
    topImage: {
        type: ControlType.ResponsiveImage,
        title: "Top Image",
    },
    bottomImage: {
        type: ControlType.ResponsiveImage,
        title: "Bottom Image",
    },
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 500,
        max: 3000,
        step: 100,
        unit: "px",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    initialRotationX: {
        type: ControlType.Number,
        title: "Initial Rotation X",
        defaultValue: -25,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
    },
    initialRotationY: {
        type: ControlType.Number,
        title: "Initial Rotation Y",
        defaultValue: 25,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
    },
})