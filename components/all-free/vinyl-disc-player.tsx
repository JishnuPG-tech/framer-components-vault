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

import { motion } from "framer-motion"

const DEFAULT_VINYL_IMAGE =
    "https://framerusercontent.com/images/WAGqtGckgU6nYGbn8dvffgzbxMU.png"

const DEFAULT_CENTER_IMAGE =
    "https://framerusercontent.com/images/FarPswIuyAjjVmxIQ9uNmscFvWI.jpeg"

// Seconds for one full rotation at Speed = 1
const BASE_ROTATION_DURATION = 1.8

const centerWrapperStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "27%",
    height: "27%",
    borderRadius: "50%",
    overflow: "hidden",
    transform: "translate(-50%, -50%)",
}

const centerImgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    mixBlendMode: "overlay",
    opacity: 0.95,
    filter: "contrast(1.15) saturate(1.1)",
}

const vinylImgStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
    userSelect: "none",
}

const spindleDotStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 8,
    height: 8,
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    background: "radial-gradient(circle,#fff,#bbb,#666)",
    boxShadow: "0 0 4px rgba(255,255,255,.5)",
}

const spinningLayerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
}

const staticLayerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
}

export default function SpinDeck(props) {
    const { vinylImage, centerImage, audioFile, size, speed } = props

    const isStatic = useIsStaticRenderer()

    const [playing, setPlaying] = React.useState(false)
    const audioRef = React.useRef(null)

    const togglePlayback = () => {
        if (isStatic) return

        const audio = audioRef.current
        if (!audio) return

        if (playing) {
            audio.pause()
            setPlaying(false)
        } else {
            audio.play()
            setPlaying(true)
        }
    }

    React.useEffect(() => {
        if (isStatic) return

        const audio = audioRef.current
        if (!audio) return

        const handleEnded = () => {
            setPlaying(false)
        }

        audio.addEventListener("ended", handleEnded)

        return () => {
            audio.removeEventListener("ended", handleEnded)
        }
    }, [isStatic])

    const resolvedVinylImage = vinylImage || DEFAULT_VINYL_IMAGE
    const resolvedCenterImage = centerImage || DEFAULT_CENTER_IMAGE

    const rotationDuration = BASE_ROTATION_DURATION / speed

    const VinylArtwork = React.useMemo(
        () => (
            <>
                <img
                    src={resolvedVinylImage}
                    alt=""
                    draggable={false}
                    style={vinylImgStyle}
                />

                {resolvedCenterImage && (
                    <div style={centerWrapperStyle}>
                        <img
                            src={resolvedCenterImage}
                            alt=""
                            draggable={false}
                            style={centerImgStyle}
                        />
                    </div>
                )}

                <div style={spindleDotStyle} />
            </>
        ),
        [resolvedVinylImage, resolvedCenterImage]
    )

    return (
        <div
            style={{
                width: size,
                height: size,
                position: "relative",
                cursor: isStatic ? "default" : "pointer",
            }}
            onClick={togglePlayback}
        >
            {!isStatic && <audio ref={audioRef} src={audioFile} />}

            {isStatic ? (
                <div style={staticLayerStyle}>{VinylArtwork}</div>
            ) : (
                <motion.div
                    animate={playing ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                        playing
                            ? {
                                  repeat: Infinity,
                                  duration: rotationDuration,
                                  ease: "linear",
                              }
                            : {
                                  duration: 0.4,
                              }
                    }
                    style={{
                        ...spinningLayerStyle,
                        willChange: playing ? "transform" : "auto",
                    }}
                >
                    {VinylArtwork}
                </motion.div>
            )}
        </div>
    )
}

SpinDeck.defaultProps = {
    size: 400,
    vinylImage: "",
    centerImage: "",
    audioFile: "",
    speed: 1,
}

addPropertyControls(SpinDeck, {
    vinylImage: {
        type: ControlType.Image,
        title: "Vinyl",
    },

    centerImage: {
        type: ControlType.Image,
        title: "Artwork",
    },

    audioFile: {
        type: ControlType.File,
        title: "Audio",
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },

    size: {
        type: ControlType.Number,
        title: "Size",
        min: 200,
        max: 1000,
        defaultValue: 400,
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "x",
        displayStepper: true,
        defaultValue: 1,
    },
})
