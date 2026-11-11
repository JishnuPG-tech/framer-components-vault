import { ComponentType, useEffect, useState } from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import BaseForm, {
    basePropertyControls,
    Input,
    Props as BaseProps,
} from "./BaseForm.tsx"

interface InputField {
    display?: boolean
    label: string
}

interface InputFields {
    [inputId: string]: InputField
}

interface Props extends BaseProps {
    inputFields: InputFields
}

const baseInputs: Input[] = [
    {
        label: "Email",
        name: "email",
        type: "email",
        required: true,
        extra: false,
        placeholder: "Email",
    },
    {
        label: "Password",
        name: "password",
        type: "password",
        required: true,
        extra: false,
        placeholder: "Password",
    },
]

/**
 * Form
 * By Joel Whitaker
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */

const formId = "sign_in"
const defaultButtonLabel = "Sign In"
const buttonLabelKey = `${formId}_button_label`

const SkeletonSignInForm: ComponentType<Props> = withCSS<Props>(
    function SkeletonSignInForm({ ...baseProps }: Props) {
        const [inputs, setInputs] = useState<Input[]>(baseInputs)

        useEffect(() => {
            if (baseProps.inputFields) {
                const newInputs: Input[] = []
                baseInputs.forEach((input) => {
                    const inputControlName = snakeToCamel(input.name)
                    if (!(inputControlName in baseProps.inputFields)) return
                    const inputField = baseProps.inputFields[inputControlName]
                    const display = inputField.display
                    const label = inputField.label
                    const placeholder = label
                    if (display === true || display === undefined) {
                        newInputs.push({ ...input, label, placeholder })
                    }
                })
                setInputs(newInputs)
            }
        }, [baseProps.inputFields])

        const onSubmit = async () => {
            return {
                ok: false,
                message:
                    "This is a dummy form. Replace it with the live component from FramerAuth.com to enable sign in, sign up, and membership access.",
            }
        }

        return (
            <BaseForm
                {...baseProps}
                isInitializing={false}
                button={{
                    ...baseProps.button,
                    label: baseProps.button[buttonLabelKey],
                }}
                inputs={inputs}
                onSubmit={onSubmit}
            />
        )
    },
    []
)

const snakeToCamel = (str: string) => {
    return str
        .split("_")
        .map((word, index) => {
            if (index === 0) return word
            return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join("")
}

const inputsPropertyControls: { [inputStr: string]: any } = {}
baseInputs.forEach((input) => {
    const inputControlName = snakeToCamel(input.name)
    inputsPropertyControls[inputControlName] = {
        title: `${input.label}`,
        type: ControlType.Object,
        controls: {
            display:
                input.extra === true
                    ? {
                          title: "Display",
                          type: ControlType.Boolean,
                          defaultValue: true,
                      }
                    : undefined,
            label: {
                title: "Label",
                type: ControlType.String,
                defaultValue: input.label,
            },
        },
    }
})

const exportBasePropertyControls = {
    ...basePropertyControls,
    inputFields: {
        title: "Inputs",
        type: ControlType.Object,
        controls: inputsPropertyControls,
    },
    button: {
        ...basePropertyControls.button,
        controls: {
            ...basePropertyControls.button.controls,
            label: undefined,
            [buttonLabelKey]: {
                ...basePropertyControls.button.controls.label,
                defaultValue: defaultButtonLabel,
            },
        },
    },
}

// @ts-ignore
addPropertyControls(SkeletonSignInForm, exportBasePropertyControls)

SkeletonSignInForm.defaultProps = {
    ...BaseForm.defaultProps,
}

export default SkeletonSignInForm
