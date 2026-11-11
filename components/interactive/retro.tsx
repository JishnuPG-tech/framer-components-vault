/*
 * Retro+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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

function Retro({
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
    font,
    background,
    progressValue,
    pixel,
    randomness,
    direction,
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
        "silhouetted"
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
                pixel={pixel}
                randomness={randomness}
                direction={direction}
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

export default Retro

Retro.displayName = "Retro+"

addPropertyControls(Retro, {
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
    pixel: {
        type: ControlType.Number,
        title: "Pixel",
        displayStepper: true,
        step: 1,
        max: 500,
        min: 1,
        defaultValue: 40,
    },
    randomness: {
        type: ControlType.Number,
        title: "Randomness",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.1,
    },
    direction: {
        type: ControlType.Enum,
        options: [
            "Top",
            "Right",
            "Bottom",
            "Left",
            "TopLeft",
            "TopRight",
            "BottomLeft",
            "BottomRight",
        ],
        optionTitles: [
            "Top",
            "Right",
            "Bottom",
            "Left",
            "TopLeft",
            "TopRight",
            "BottomLeft",
            "BottomRight",
        ],
        title: "Origin",
        defaultValue: "Left",
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            // scale: {
            //     type: ControlType.Boolean,
            //     title: "Scale Effect",
            //     defaultValue: false,
            // },
            // scaleValue: {
            //     type: ControlType.Number,
            //     title: "Scale Value",
            //     displayStepper: true,
            //     step: 0.1,
            //     max: 2,
            //     min: 0,
            //     defaultValue: 0.9,
            //     hidden(props) {
            //         return props.scale === false
            //     },
            // },
            blend: {
                type: ControlType.Boolean,
                title: "Blend",
                defaultValue: true,
            },
            tint: {
                type: ControlType.Boolean,
                title: "Tint",
                defaultValue: false,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ff5500",
                hidden(props) {
                    return props.tint === false
                },
            },
            brightness: {
                type: ControlType.Number,
                title: "Brightness",
                displayStepper: true,
                step: 1,
                max: 10,
                min: 0,
                defaultValue: 4,
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
                    // pixel: {
                    //     type: ControlType.Number,
                    //     title: "Pixel",
                    //     displayStepper: true,
                    //     step: 1,
                    //     max: 500,
                    //     min: 1,
                    //     defaultValue: 40,
                    //     hidden(props) {
                    //         return !props.enable
                    //     },
                    // },
                    randomness: {
                        type: ControlType.Number,
                        title: "Randomness",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 0.1,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    // color: {
                    //     type: ControlType.Color,
                    //     title: "Color",
                    //     defaultValue: "#ff5500",
                    //     hidden(props) {
                    //         return !props.enable
                    //     },
                    // },
                    brightness: {
                        type: ControlType.Number,
                        title: "Brightness",
                        displayStepper: true,
                        step: 1,
                        max: 10,
                        min: 0,
                        defaultValue: 4,
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
            duration: 2,
            ease: [0, 0, 1, 1],
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
