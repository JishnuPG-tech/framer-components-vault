/*
 * Sampling+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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

function Sampling({
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
    pixel,
    brightness,
    contrast,
    saturation,
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
        "leaf"
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
                pixel={pixel}
                brightness={brightness}
                contrast={contrast}
                saturation={saturation}
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

export default Sampling

Sampling.displayName = "Sampling+"

addPropertyControls(Sampling, {
    ...propertyControls.media,
    ...propertyControls.size,
    pixel: {
        type: ControlType.Number,
        title: "Pixel",
        displayStepper: false,
        step: 1,
        max: 200,
        min: 1,
        defaultValue: 20,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        displayStepper: false,
        step: 0.1,
        max: 1,
        min: -1,
        defaultValue: 0,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        displayStepper: false,
        step: 0.1,
        max: 2,
        min: -1,
        defaultValue: 1,
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        displayStepper: false,
        step: 0.1,
        max: 2,
        min: -1,
        defaultValue: 1,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Animation",
                options: ["seamless", "stepped"],
                optionTitles: ["Seamless", "Stepped"],
                displaySegmentedControl: true,
                defaultValue: "stepped",
            },
            step: {
                type: ControlType.Number,
                title: "Step",
                displayStepper: true,
                step: 1,
                max: 100,
                min: 0,
                defaultValue: 10,
                hidden(props) {
                    return props.type === "seamless"
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
                    pixel: {
                        type: ControlType.Number,
                        title: "Pixel",
                        displayStepper: false,
                        step: 1,
                        max: 200,
                        min: 0,
                        defaultValue: 1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    brightness: {
                        type: ControlType.Number,
                        title: "Brightness",
                        displayStepper: false,
                        step: 0.1,
                        max: 1,
                        min: -1,
                        defaultValue: 0,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    contrast: {
                        type: ControlType.Number,
                        title: "Contrast",
                        displayStepper: false,
                        step: 0.1,
                        max: 2,
                        min: -1,
                        defaultValue: 1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    saturation: {
                        type: ControlType.Number,
                        title: "Saturation",
                        displayStepper: false,
                        step: 0.1,
                        max: 2,
                        min: -1,
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
            delay: 0,
            duration: 1,
            ease: [0, 0, 1, 1],
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
