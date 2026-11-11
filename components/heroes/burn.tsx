/*
 * Burn+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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
import { Scene } from "./Scene.tsx"

/**
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 *
 */

function Burn({
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
    content,
    background,
    font,
    burn,
    density,
    distortion,
    advance,
    section,
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
        "astronaut"
    )

    const shouldReduceMotion = useReducedMotion()
    const useCompatibility =
        accessibility.compatibility ||
        (accessibility.reduce && shouldReduceMotion)

    if (useCompatibility) {
        return (
            <CompatibleMedia
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                imageAlt={imageAlt}
                fit={fit}
                loop={loop}
                content={content}
                font={font}
                background={background}
                useCompatibility={useCompatibility}
            />
        )
    }

    return (
        <>
            <Scene
                mediaType={mediaType}
                mediaSrc={mediaSrc}
                imageAlt={imageAlt}
                loop={loop}
                fit={fit}
                content={content}
                background={background}
                font={font}
                burn={burn}
                density={density}
                distortion={distortion}
                advance={advance}
                animateProp={{ ...animateProp, section }}
                transitionProp={transition}
                accessibility={accessibility}
                ariaLabel={ariaLabel}
                onLoad={onLoad}
                onError={onError}
                onVideoEnd={onVideoEnd}
                onAnimationComplete={onAnimationComplete}
            />
            {mediaType === "text" && (
                <CompatibleMedia
                    mediaType={mediaType}
                    mediaSrc={mediaSrc}
                    imageAlt={imageAlt}
                    fit={fit}
                    loop={loop}
                    content={content}
                    font={font}
                    background={background}
                    useCompatibility={useCompatibility}
                />
            )}
        </>
    )
}

export default Burn

Burn.displayName = "Burn+"

addPropertyControls(Burn, {
    ...propertyControls.media,
    ...propertyControls.size,
    burn: {
        type: ControlType.Number,
        title: "Burn",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.7,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.5,
    },
    distortion: {
        type: ControlType.Number,
        title: "Distortion",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: -1,
        defaultValue: 0.3,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            edgeColor: {
                type: ControlType.Color,
                title: "Edge Color",
                defaultValue: "rgba(0, 0, 0, 1)",
            },
            maskColor: {
                type: ControlType.Color,
                title: "Mask Color",
                defaultValue: "rgba(255, 255, 255, 1)",
            },
            transparent: {
                type: ControlType.Boolean,
                title: "Transparent",
                defaultValue: true,
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 0.5,
            },
            dispersion: {
                type: ControlType.Number,
                title: "Dispersion",
                displayStepper: true,
                step: 0.1,
                max: 1,
                min: 0,
                defaultValue: 1,
            },
            invertMask: {
                type: ControlType.Boolean,
                title: "Invert",
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
                    burn: {
                        type: ControlType.Number,
                        title: "Burn",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.7,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    density: {
                        type: ControlType.Number,
                        title: "Density",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.5,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    distortion: {
                        type: ControlType.Number,
                        title: "Distortion",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: -1,
                        defaultValue: 0.3,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    edgeColor: {
                        type: ControlType.Color,
                        title: "Edge Color",
                        defaultValue: "rgba(0, 0, 0, 1)",
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    maskColor: {
                        type: ControlType.Color,
                        title: "Mask Color",
                        defaultValue: "rgba(255, 255, 255, 1)",
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    hardness: {
                        type: ControlType.Number,
                        title: "Hardness",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.5,
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
                        defaultValue: 1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                },
            },
        },
    },
    ...propertyControls.scrollControls,
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            ease: "linear",
            duration: 2,
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
