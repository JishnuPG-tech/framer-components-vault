/*
 * Unfocused+ was created by Jayzhushi. Visit Reveals.cool to learn more.
 * For assistance, contact x.com/jayzhushi or email jayzhushi@gmail.com.
 * This component is licensed under the BSD License.
 */

import React, { useRef, useEffect, useState, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    CompatibleMedia,
    propertyControls,
    useMediaSource,
} from "../UseSetup.tsx"
import { OGLScene } from "./OGL.tsx"

/**
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 800
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 *
 */

function Unfocused({
    type,
    file,
    upImage,
    urlVideo,
    upVideo,
    defaultImage,
    dark,
    darkImage,
    loop,
    fit,
    blur,
    angle,
    falloff,
    advance,
    animateProp,
    transition,
    accessibility,
    ariaLabel,
    onLoad,
    onError,
    onVideoEnd,
    onAnimationComplete,
}) {
    const { imageAlt, mediaSrc, mediaType } = useMediaSource(
        type,
        file,
        urlVideo,
        upVideo,
        defaultImage,
        darkImage,
        dark,
        "arch_dark"
    )

    const shouldReduceMotion = useReducedMotion()

    if (
        accessibility.compatibility ||
        (accessibility.reduce && shouldReduceMotion)
    ) {
        return (
            <CompatibleMedia
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                imageAlt={imageAlt}
                fit={fit}
                loop={loop}
            />
        )
    }

    return (
        <OGLScene
            mediaType={mediaType}
            mediaSrc={mediaSrc}
            imageAlt={imageAlt}
            loop={loop}
            fit={fit}
            blur={blur}
            angle={angle}
            falloff={falloff}
            advance={advance}
            animateProp={animateProp}
            transitionProp={transition}
            accessibility={accessibility}
            ariaLabel={ariaLabel}
            onLoad={onLoad}
            onError={onError}
            onVideoEnd={onVideoEnd}
            onAnimationComplete={onAnimationComplete}
        />
    )
}

export default Unfocused

Unfocused.displayName = "Unfocused+"

addPropertyControls(Unfocused, {
    ...propertyControls.media,
    ...propertyControls.size,
    blur: {
        type: ControlType.Number,
        title: "Blur",
        displayStepper: false,
        step: 1,
        max: 1000,
        min: 0,
        defaultValue: 200,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        displayStepper: false,
        step: 1,
        max: 360,
        min: 0,
        unit: "°",
        defaultValue: 45,
    },
    falloff: {
        type: ControlType.Number,
        title: "Falloff",
        displayStepper: false,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 1,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            falloffType: {
                type: ControlType.Enum,
                title: "Type",
                options: [0, 1, 2, 3],
                optionTitles: ["Linear", "Quadratic", "Cubic", "Square"],
                defaultValue: 0,
            },
            originX: {
                type: ControlType.Number,
                title: "Origin X",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0,
            },
            originY: {
                type: ControlType.Number,
                title: "Origin Y",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.5,
            },
            scale: {
                type: ControlType.Number,
                title: "Distortion",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: -1,
                defaultValue: 0,
            },
            dispersion: {
                type: ControlType.Number,
                title: "Dispersion",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.2,
                description: "Affected by *Blur*.",
            },
            noise: {
                type: ControlType.Number,
                title: "Noise",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 1,
            },
            noiseBlend: {
                type: ControlType.Enum,
                title: "Blend",
                options: [0, 1, 2, 3],
                optionTitles: ["None", "Lighter", "Darker", "Both"],
                defaultValue: 0,
                hidden(props) {
                    return props.noise === 0
                },
            },
        },
    },
    animateProp: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Animation",
        icon: "interaction",
        controls: {
            ...propertyControls.animateControls,
            custom: {
                type: ControlType.Object,
                title: "Custom",
                buttonTitle: "Custom",
                icon: "effect",
                hidden(props) {
                    return props.type === "disable" || props.type === "variant"
                },
                controls: {
                    enable: {
                        type: ControlType.Boolean,
                        title: "Enable",
                        defaultValue: false,
                        description:
                            "Customize the animation target value for each property.",
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        displayStepper: false,
                        step: 1,
                        max: 1000,
                        min: 0,
                        defaultValue: 40,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    angle: {
                        type: ControlType.Number,
                        title: "Angle",
                        displayStepper: false,
                        step: 1,
                        max: 360,
                        min: 0,
                        unit: "°",
                        defaultValue: 0,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    falloff: {
                        type: ControlType.Number,
                        title: "Falloff",
                        displayStepper: false,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    scale: {
                        type: ControlType.Number,
                        title: "Distortion",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: -1,
                        defaultValue: 0,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    dispersion: {
                        type: ControlType.Number,
                        title: "Dispersion",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.2,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    noise: {
                        type: ControlType.Number,
                        title: "Noise",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                },
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            ease: "linear",
            duration: 2,
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
