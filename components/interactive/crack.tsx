/*
 * Crack+ was created by Jayzhushi. Visit Reveals.cool to learn more.
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

function Crack({
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
    segment,
    strength,
    dispersion,
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
        "porsche"
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
                segment={segment}
                strength={strength}
                dispersion={dispersion}
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

export default Crack

Crack.displayName = "Crack+"

addPropertyControls(Crack, {
    ...propertyControls.mediaNoText,
    ...propertyControls.size,
    segment: {
        type: ControlType.Number,
        title: "Segment",
        displayStepper: true,
        step: 1,
        max: 100,
        min: 1,
        defaultValue: 8,
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 1,
    },
    dispersion: {
        type: ControlType.Number,
        title: "Dispersion",
        displayStepper: true,
        step: 0.1,
        max: 1,
        min: 0,
        defaultValue: 0.4,
    },
    advance: {
        type: ControlType.Object,
        title: "Advance",
        buttonTitle: "Advance",
        icon: "effect",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["pleats", "grid"],
                optionTitles: ["Pleats", "Grid"],
                displaySegmentedControl: true,
                defaultValue: "grid",
            },
            fadeIn: {
                type: ControlType.Boolean,
                title: "Fade In",
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
                    segment: {
                        type: ControlType.Number,
                        title: "Segment",
                        displayStepper: true,
                        step: 1,
                        max: 100,
                        min: 1,
                        defaultValue: 8,
                        hidden(props) {
                            return !props.enable
                        },
                    },
                    strength: {
                        type: ControlType.Number,
                        title: "Strength",
                        displayStepper: true,
                        step: 0.1,
                        max: 1,
                        min: 0,
                        defaultValue: 1,
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
                        defaultValue: 0.4,
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
            ease: [0.44, 0, 0.56, 1],
        },
    },
    ...propertyControls.accessibility,
    ...propertyControls.eventHandler,
})
