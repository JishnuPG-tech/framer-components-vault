/*
 * Scan+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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

function Scan({
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
    progressValue,
    angle,
    sensitivity,
    brightness,
    color,
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
        "structure"
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
                font={font}
                background={background}
                progressValue={progressValue}
                angle={angle}
                sensitivity={sensitivity}
                brightness={brightness}
                color={color}
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

export default Scan

Scan.displayName = "Scan+"

addPropertyControls(Scan, {
    ...propertyControls.media,
    ...propertyControls.size,
    progressValue: {
        type: ControlType.Number,
        title: "Progress",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0,
        hidden(props) {
            return props.animateProp.type !== "variant"
        },
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        displayStepper: true,
        step: 5,
        max: 360,
        min: -360,
        unit: "°",
        defaultValue: 0,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.9,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        displayStepper: true,
        step: 0.1,
        max: 2,
        min: 0,
        defaultValue: 2.0,
    },
    color: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "#0099ff",
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
                    progressValue: {
                        type: ControlType.Number,
                        title: "Progress",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0,
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
            duration: 4,
            ease: [0.44, 0, 0.56, 1],
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
