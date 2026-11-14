/*
 * Tsunami+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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
import { OGLScene } from "../Tsunami/OGL.tsx"

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

function Tsunami({
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
    waveProgress,
    angle,
    distortion,
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
        "dice_dark"
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
            waveProgress={waveProgress}
            angle={angle}
            distortion={distortion}
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

export default Tsunami

Tsunami.displayName = "Tsunami+"

addPropertyControls(Tsunami, {
    ...propertyControls.media,
    ...propertyControls.size,
    distortion: {
        type: ControlType.Number,
        title: "Distortion",
        displayStepper: false,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.6,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        displayStepper: false,
        step: 1,
        max: 360,
        min: 0,
        unit: "°",
        defaultValue: 90,
    },
    waveProgress: {
        type: ControlType.Number,
        title: "Offset",
        displayStepper: false,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.5,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            waveWidth: {
                type: ControlType.Number,
                title: "Width",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.2,
            },
            disturbance: {
                type: ControlType.Number,
                title: "Disturbance",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.3,
            },
            dispersion: {
                type: ControlType.Number,
                title: "Dispersion",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.3,
                description: "Affected by *Distortion*.",
            },
            reflection: {
                type: ControlType.Number,
                title: "Reflection",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.1,
            },
            blendReflection: {
                type: ControlType.Boolean,
                title: "Blend",
                defaultValue: true,
                hidden(props) {
                    return props.reflection === 0
                },
            },
            // shadow: {
            //     type: ControlType.Number,
            //     title: "Shadow",
            //     displayStepper: true,
            //     step: 0.1,
            //     max: 1,
            //     min: 0,
            //     defaultValue: 0,
            // },
            // blendShadow: {
            //     type: ControlType.Boolean,
            //     title: "Blend",
            //     defaultValue: true,
            //     hidden(props) {
            //         return props.shadow === 0
            //     },
            // },
            mask: {
                type: ControlType.Boolean,
                title: "Mask",
                defaultValue: false,
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
                    distortion: {
                        type: ControlType.Number,
                        title: "Distortion",
                        displayStepper: false,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.6,
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
                        defaultValue: 90,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    waveProgress: {
                        type: ControlType.Number,
                        title: "Offset",
                        displayStepper: false,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.5,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    waveWidth: {
                        type: ControlType.Number,
                        title: "Width",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.2,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    disturbance: {
                        type: ControlType.Number,
                        title: "Disturbance",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.3,
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
                    reflection: {
                        type: ControlType.Number,
                        title: "Reflection",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.5,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    // shadow: {
                    //     type: ControlType.Number,
                    //     title: "Shadow",
                    //     displayStepper: true,
                    //     step: 0.1,
                    //     max: 1,
                    //     min: 0,
                    //     defaultValue: 0,
                    //     hidden(props) {
                    //         return !props.enable
                    //     },
                    // },
                },
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            ease: "linear",
            duration: 4,
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
