/**
 * ============================================================================
 * ✨ GOOEY INTERACTION BUTTON ✨
 * ============================================================================
 * Fluid motion micro-interaction for modern UI systems.
 *
 * CUSTOMIZATION:
 * - Adjust transition easing to control motion feel (spring vs precise).
 * - Tune duration and delay for responsiveness.
 * - Extend icons and styles to match your design system.
 *
 * USE CASES:
 * - High-impact CTAs
 * - Destructive actions (delete / navigate)
 * - Interactive or playful UI elements
 *
 * ============================================================================
 */

import React from "react"
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
import { X, Check, Trash, Heart, Play, Question } from "phosphor-react"

/* TYPES */
export type GooeySVG_property = {
    filter_id: string
    height: number
}
export type GooeyButton_props = {
    active: boolean
    disabled: {
        is_disabled: boolean
        popover: string
    }
    triggers: {
        open: "click" | "hover" | "press"
        close: {
            main_button: boolean
            sub_button: boolean
            outside: boolean
        }
    }
    role: "delete" | "navigate" | "hide" | "none"
    cursor: {
        disabled: "default" | "pointer" | "help" | "none" | "not-allowed"
        enabled: "default" | "pointer" | "help" | "none" | "not-allowed"
    }
    transition: {
        duration: number
        easing: string
    }
    size: {
        width: number
        height: number
    }
    background: {
        active: string
        initial: string
        disabled: string
    }
    label: {
        active: string
        initial: string
    }
    text: {
        size: number
        font: Record<string, any>
        color: { initial: string; active: string; disabled: string }
        weight: number
        spacing: number
    }
    icon: {
        element: "Question" | "Cancel" | "Check" | "Trash" | "Heart" | "Play"
        size: number
        color: string
    }
    target_content?: React.ReactElement
    target_styling?: {
        space: number
        align: "row" | "column" | "row-reverse" | "column-reverse"
    }
    hide_transition: {
        duration: number
        easing: string
    }
    navigation_path?: string
}

/* STYLING  */
//REUABLES
const flex_element_cntr: React.CSSProperties = {
    display: `flex`,
    alignItems: `center`,
    justifyContent: `center`,
}

//BUTTON
const button_component: React.CSSProperties = {
    position: `relative`,
    width: "max-content",
    ...flex_element_cntr,
}
const btn_wrapper_style = {
    ...flex_element_cntr,
}

const aria_button_texts: React.CSSProperties = {
    ...flex_element_cntr,
    position: `absolute`,
    flex: 1,
    opacity: 0,
    margin: `auto`,
    inset: 0,
}
const main_button_style: React.CSSProperties = {
    //BORDER
    border: "none",
    borderRadius: "50px",

    //FONT
    cursor: `pointer`,

    //LAYOUT
    zIndex: 1,
    gap: 5,
    ...flex_element_cntr,
}

const secondary_button: React.CSSProperties = {
    //SIZE
    height: "85%",

    //BORDER
    aspectRatio: "1/1",
    borderRadius: "50px",

    //LAYOUT
    position: "absolute",
    right: 0,
    marginInline: 1,

    //BORDER
    border: "none",
    cursor: "pointer",
    ...flex_element_cntr,
}

//COMPONENTS
const GooeySVG = ({ filter_id, height }: GooeySVG_property) => (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
            <filter
                filterUnits="objectBoundingBox"
                colorInterpolationFilters="sRGB"
                style={{ position: "absolute", width: 0, height: 0 }}
                id={filter_id}
            >
                <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation={height * 0.16}
                    result="blur"
                />
                <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                    result="goo"
                />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
        </defs>
    </svg>
)

export default function GooeyButton({
    transition,
    disabled,
    triggers,
    role,
    cursor,
    active,
    background,
    label,
    size,
    text,
    icon,
    target_content,
    target_styling,
    navigation_path,
    hide_transition,
}: GooeyButton_props) {
    //ID
    const svg_filter_id = `gooey-${React.useId()}`

    //STATES
    const [target_state, set_target_state] = React.useState<
        "visible" | "deleted" | "hidden"
    >("visible")

    const [active_state, set_active_state] = React.useState(() =>
        disabled.is_disabled ? false : active
    )
    const [was_launched, set_was_launched] = React.useState(false)
    const [motion_prefs, set_motion_prefs] = React.useState(false)

    //REFS
    const main_button_ref = React.useRef<HTMLDivElement | null>(null)
    const targets_ele_ref = React.useRef<HTMLDivElement | null>(null)

    //MEMO & VARS
    const Icon_Mapping = {
        Question,
        Cancel: X,
        Check,
        Trash,
        Heart,
        Play,
    }

    const label_letters: string[] = React.useMemo(() => {
        const ui_text: string = active_state
            ? label?.active || "Confirm"
            : label?.initial || "Remove"

        return ui_text.length > 0
            ? ui_text.split("").map((c) => (c === " " ? "\u00A0" : c))
            : ["\u00A0"]
    }, [label.initial, label.active, active_state])

    const Icons_component = React.useMemo(
        () => Icon_Mapping[icon?.element || "Cancel"],
        [icon?.element]
    )

    const triggers_action = React.useMemo(() => {
        const handle_finish = () => set_active_state(false)
        const handle_launch = () => {
            set_active_state(true)
            set_was_launched(true)
        }
        const handle_switch = () => {
            set_active_state((prv) => !prv)
            set_was_launched(true)
        }

        const trigger_actions_object = {
            click: {
                onClick:
                    triggers.close.main_button &&
                    active_state &&
                    triggers.open == "click"
                        ? handle_switch
                        : handle_launch,
            },
            press: {
                onMouseDown: handle_launch,
                onMouseUp: handle_finish,
                onMouseLeave: handle_finish,
            },
        }
        return (
            trigger_actions_object[triggers.open] ||
            trigger_actions_object.click
        )
    }, [triggers.open, triggers.close, active_state])

    //EFFECT
    React.useEffect(() => {
        if (!active_state || !was_launched) return
        const handle_click_outside = (event: MouseEvent) => {
            if (
                main_button_ref.current &&
                !main_button_ref.current.contains(event.target as Node) &&
                triggers.open == "click" &&
                triggers.close.outside
            ) {
                set_active_state(false)
            }
        }

        document.addEventListener("mousedown", handle_click_outside)

        return () => {
            document.removeEventListener("mousedown", handle_click_outside)
        }
    }, [
        triggers.open,
        triggers.close.outside,
        triggers.close.main_button,
        active_state,
    ])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const handler = () => set_motion_prefs(media.matches)

        handler()
        media.addEventListener("change", handler)
        return () => media.removeEventListener("change", handler)
    }, [])

    React.useEffect(() => {
        if (was_launched) return
        set_active_state(!disabled.is_disabled && active)
    }, [active, disabled.is_disabled, was_launched])

    //CALLBACKS
    const sub_btn_action = React.useCallback(async () => {
        if (disabled.is_disabled) return
        else {
            set_active_state(false)
            if (role === "none") return
            else if (role == "navigate") {
                window.location.href = navigation_path?.href || navigation_path
            } else if (["delete", "hide"].includes(role)) {
                const element = targets_ele_ref.current
                if (!element) return
                else if (role == "hide") set_target_state("hidden")
                else if (role == "delete") set_target_state("deleted")
            }
        }
    }, [
        triggers.open,
        triggers.close.sub_button,
        disabled.is_disabled,
        navigation_path,
        role,
    ])

    return (
        <div
            ref={main_button_ref}
            style={{
                ...button_component,

                //DISPLAY
                display: "flex",
                flexDirection: target_styling?.align || "row",

                gap:
                    ["hide", "delete"].includes(role) &&
                    Boolean(target_content?.length)
                        ? (target_styling?.space || 0) + "px"
                        : "0",
            }}
        >
            <GooeySVG filter_id={svg_filter_id} height={size.height} />

            <div
                {...(triggers.open == "hover"
                    ? {
                          onMouseOver: () => {
                              set_active_state(true)
                              set_was_launched(true)
                          },
                          onMouseLeave: () => set_active_state(false),
                      }
                    : {})}
                style={{
                    ...btn_wrapper_style,
                    filter: `url(#${svg_filter_id})`,
                }}
            >
                <span
                    id={`hover_bridge`}
                    style={{
                        //SIZE
                        aspectRatio: 1 / 1,
                        height: size.height + "px",
                        pointerEvents:
                            triggers.open == "hover" ? "auto" : "none",

                        //POSTION
                        position: `absolute`,
                        translate: -25 + "px",

                        top: "0px",
                        left: "100%",
                    }}
                />

                <button
                    id={`main_button`}
                    //ACCESSIBILITY
                    type="button"
                    disabled={disabled.is_disabled}
                    aria-pressed={active_state}
                    title={disabled.is_disabled ? disabled.popover : null}
                    //EVENTS
                    {...triggers_action}
                    //STYLING
                    style={{
                        ...main_button_style,

                        //COLOR
                        backgroundColor: disabled.is_disabled
                            ? background?.disabled || "#222833"
                            : active_state
                              ? background.active || "#FF3D3D"
                              : background.initial || "#030712",

                        //SIZE
                        height: size.height + "px",
                        width: size.width + "px",

                        //TRANSITION
                        transitionProperty: "background-color",
                        transitionDuration: transition.duration + "ms",
                        transitionTimingFunction: transition.easing,

                        //CONFIG
                        cursor: disabled.is_disabled
                            ? cursor.disabled || "not-allowed"
                            : cursor.enabled || "pointer",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            //TEXT LAYOUT
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {label_letters.map((ltr, i) => (
                            <motion.span
                                key={`${ltr}-${i}-${active_state ? "active" : "initial"}`}
                                initial={
                                    motion_prefs
                                        ? false
                                        : {
                                              opacity: was_launched ? 0.2 : 1,
                                              filter: `blur(${was_launched ? 30 : 0}px)`,
                                          }
                                }
                                animate={
                                    motion_prefs
                                        ? false
                                        : {
                                              opacity: 1,
                                              filter: "blur(0px)",
                                          }
                                }
                                exit={{
                                    opacity: 0.2,
                                    filter: "blur(30px)",
                                }}
                                transition={{
                                    ease: "anticipate",
                                    opacity: {
                                        duration: 0.5,
                                        delay: active_state
                                            ? i * 0.01
                                            : (label_letters.length - i) * 0.01,
                                    },
                                    filter: {
                                        duration: 0.5,
                                        delay: active_state
                                            ? i * 0.015
                                            : (label_letters.length - i) *
                                              0.015,
                                    },
                                }}
                                style={{
                                    display: "inline-block",

                                    //FONT
                                    fontFamily:
                                        text?.font?.fontFamily ||
                                        "Inter Display, Inter , sans-serif",
                                    fontWeight: text?.weight || 400,
                                    fontSize: text.size || 15,
                                    marginInline: (text?.spacing || 0) + "px",
                                    pointerEvents: `none`,
                                    //background
                                    color: disabled.is_disabled
                                        ? text?.color?.disabled || "#94A3B8"
                                        : active_state
                                          ? text?.color?.active || "#210000"
                                          : text?.color?.initial || "#F8FAFC",
                                }}
                            >
                                {ltr}
                            </motion.span>
                        ))}
                    </div>
                </button>
                <button
                    id={`action_button`}
                    //ACCESSIBILITY
                    type={"button"}
                    role={"button"}
                    tabIndex={active_state ? 0 : -1}
                    aria-hidden={!active_state}
                    disabled={!active_state || disabled.is_disabled}
                    //EVENT
                    onClick={sub_btn_action}
                    //STYLE
                    style={
                        {
                            ...secondary_button,
                            ...flex_element_cntr,

                            //LAYOUT
                            transform: active_state
                                ? `translateX(${size.height * 1.2}px)`
                                : "translateX(0%)",

                            //TRANSITION
                            transitionProperty:
                                "transform , background , opacity  ",
                            transitionDuration: `${transition.duration}ms`,
                            transitionDelay: `0ms,0ms, ${active_state ? "0" : transition.duration}ms`,
                            transitionTimingFunction:
                                transition?.easing ||
                                "cubic-bezier(0.4, 0, 0.2, 1.4)",

                            //UI
                            opacity: active_state ? 1 : 0,
                            backgroundColor: disabled.is_disabled
                                ? background?.disabled || "#222833"
                                : active_state
                                  ? background.active || "#FF3D3D"
                                  : background.initial || "#030712",
                        } as React.CSSProperties
                    }
                >
                    <Icons_component
                        style={{
                            transform: `rotateZ(${active_state ? 0 : -90}deg)`,
                            transition: `transform ${transition.duration}ms ${transition.easing}`,
                        }}
                        size={icon?.size || 17}
                        weight="bold"
                        color={icon?.color || "black"}
                    />
                </button>
            </div>
            <div
                ref={targets_ele_ref}
                style={
                    {
                        //LAYOUT DISPLAY
                        display: ["navigate", "none"].includes(role)
                            ? "none"
                            : target_state == "deleted"
                              ? "none"
                              : "block",
                        opacity: target_state == "hidden" ? "0" : "1",

                        ...(role == "hide"
                            ? {
                                  //TRANSITIONS
                                  transitionProperty: "opacity",
                                  transitionDuration:
                                      (hide_transition?.duration || 500) + "ms",
                                  transitionTimingFunction:
                                      hide_transition?.easing || "linear",
                              }
                            : {}),
                    } as React.CSSProperties
                }
            >
                {target_content}
            </div>
        </div>
    )
}

//CONTROLLERS
addPropertyControls(GooeyButton, {
    active: {
        type: ControlType.Boolean,
        title: "Active",
        defaultValue: false,
        hidden: ({ disabled }) => disabled.is_disabled,
    },
    disabled: {
        type: ControlType.Object,
        controls: {
            is_disabled: {
                type: ControlType.Boolean,
                title: "is disabled",
                defaultValue: false,
            },
            popover: {
                type: ControlType.String,
                title: "popover",
                hidden: ({ is_disabled }) => !is_disabled,
                defaultValue: "action is disabled",
            },
        },
    },
    triggers: {
        type: ControlType.Object,
        controls: {
            open: {
                type: ControlType.Enum,
                title: "open",
                options: ["click", "hover", "press"],
                defaultValue: "click",
            },
            close: {
                type: ControlType.Object,
                title: "close",
                hidden: ({ open }) => open != "click",
                controls: {
                    main_button: {
                        type: ControlType.Boolean,
                        defaultValue: true,
                    },
                    sub_button: {
                        type: ControlType.Boolean,
                        defaultValue: true,
                    },
                    outside: {
                        type: ControlType.Boolean,
                        defaultValue: false,
                    },
                },
            },
        },
    },
    role: {
        type: ControlType.Enum,
        options: ["delete", "navigate", "hide", "none"],
        hidden: ({ triggers }) => triggers.open == "press",
        defaultValue: "none",
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursors",
        controls: {
            disabled: {
                type: ControlType.Enum,
                options: ["default", "pointer", "help", "none", "not-allowed"],
                defaultValue: "not-allowed",
            },
            enabled: {
                type: ControlType.Enum,
                options: ["default", "pointer", "help", "none", "not-allowed"],
                defaultValue: "pointer",
            },
        },
    },
    transition: {
        type: ControlType.Object,
        title: "Transition",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "duration",
                defaultValue: 450,
                unit: "ms",
                max: 3000,
                min: 300,
            },
            easing: {
                type: ControlType.Enum,
                defaultValue: "cubic-bezier(0.4, 0, 0.2, 1.4)",
                optionTitles: [
                    "spring",
                    "heavy liquid",
                    "elastic snap",
                    "Smooth Organic",
                    "Luxury Ease",
                    "Fluid Fade",
                ],
                options: [
                    "cubic-bezier(0.4, 0, 0.2, 1.4)",
                    "cubic-bezier(0.9, 0.03, 0.69, 0.22)",
                    "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
                    "cubic-bezier(0.4, 0, 0.2, 1)",
                    "cubic-bezier(0.22, 1, 0.36, 1)",
                    "cubic-bezier(0.65, 0, 0.35, 1)",
                ],
            },
        },
    },
    // SIZE OBJECT
    size: {
        type: ControlType.Object,
        title: "Size",
        controls: {
            width: {
                type: ControlType.Number,
                defaultValue: 120,
                step: 10,
                min: 105,
                max: 400,
            },
            height: {
                type: ControlType.Number,
                defaultValue: 50,
                max: 80,
                min: 40,
            },
        },
    },
    // COLOR OBJECT
    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            initial: { type: ControlType.Color, defaultValue: "#030712" },
            active: { type: ControlType.Color, defaultValue: "#FF3D3D" },
            disabled: { type: ControlType.Color, defaultValue: "#222833" },
        },
    },
    // LABEL OBJECT
    label: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            initial: {
                type: ControlType.String,
                defaultValue: "Remove",
            },
            active: {
                type: ControlType.String,
                defaultValue: "Confirm",
            },
        },
    },
    icon: {
        type: ControlType.Object,
        title: "Icon ",
        controls: {
            element: {
                type: ControlType.Enum,
                options: [
                    "Question",
                    "Cancel",
                    "Trash",
                    "Check",
                    "Heart",
                    "Play",
                ],
                defaultValue: "Cancel",
                title: "element",
            },
            size: {
                type: ControlType.Number,
                defaultValue: 14,
                max: 20,
                min: 8,
            },
            color: {
                type: ControlType.Color,
                defaultValue: "#210000",
            },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            font: {
                type: ControlType.Font,
                title: "font",
                defaultFontType: "sans-serif",
            },

            size: {
                type: ControlType.Number,
                defaultValue: 13,
                step: 1,
                max: 18,
                min: 9,
            },
            weight: {
                type: ControlType.Number,
                defaultValue: 500,
                step: 100,
                max: 1000,
                min: 100,
            },
            spacing: {
                type: ControlType.Number,
                defaultValue: 0,
                step: 0.1,
                max: 2,
                min: 0,
            },
            color: {
                type: ControlType.Object,
                title: "Colors",
                controls: {
                    initial: {
                        type: ControlType.Color,
                        defaultValue: "#F8FAFC",
                    },
                    active: {
                        type: ControlType.Color,
                        defaultValue: "#210000",
                    },
                    disabled: {
                        type: ControlType.Color,
                        defaultValue: "#94A3B8",
                    },
                },
            },
        },
    },
    target_content: {
        type: ControlType.ComponentInstance,
        title: "Target Element",
        hidden: ({ role }) => !["delete", "hide"].includes(role),
    },
    target_styling: {
        type: ControlType.Object,
        title: "Target Styling",
        hidden: ({ role }) => !["delete", "hide"].includes(role),
        controls: {
            space: {
                type: ControlType.Number,
                title: "element spacing",
                defaultValue: 20,
                max: 200,
            },
            align: {
                type: ControlType.Enum,
                title: "element align",
                options: ["row", "column", "row-reverse", "column-reverse"],
                optionTitles: [
                    "row",
                    "column",
                    "row reverse",
                    "column reverse",
                ],
                defaultValue: "column",
            },
        },
    },
    hide_transition: {
        type: ControlType.Object,
        title: "Hide Transition",
        hidden: ({ role }) => role != "hide",
        controls: {
            duration: {
                type: ControlType.Number,
                title: `duration`,
                max: 5000,
                min: 100,
            },
            easing: {
                type: ControlType.Enum,
                defaultValue: "cubic-bezier(0.4, 0, 0.2, 1.4)",
                optionTitles: [
                    "spring",
                    "heavy liquid",
                    "elastic snap",
                    "Smooth Organic",
                    "Luxury Ease",
                    "Fluid Fade",
                ],
                options: [
                    "cubic-bezier(0.4, 0, 0.2, 1.4)",
                    "cubic-bezier(0.9, 0.03, 0.69, 0.22)",
                    "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
                    "cubic-bezier(0.4, 0, 0.2, 1)",
                    "cubic-bezier(0.22, 1, 0.36, 1)",
                    "cubic-bezier(0.65, 0, 0.35, 1)",
                ],
            },
        },
    },
    navigation_path: {
        type: ControlType.Link,
        title: "Navigation Path",
        hidden: ({ role }) => role != "navigate",
    },
})
