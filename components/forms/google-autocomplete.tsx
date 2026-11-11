// Get Started: https://www.framer.com/developers
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"

const usePlace = createStore({})
const useLoadState = createStore() as CreateStore<null | "loaded" | "done">

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GoogleMapsAutocomplete(props) {
    let {
        apiKey,
        name,
        overrides,
        colorScheme,
        border,
        borderRadius,
        backgroundColor,
        options,
        ...restProps
    } = props
    const internalRef = useRef(null)
    const parentFormRef = useRef<HTMLFormElement>(null)
    /**
     * The created Google Places autocomplete input element (with shadow dom)
     * https://developers.google.com/maps/documentation/javascript/place-get-started#load-places-library
     */
    const autocompleteElementRef = useRef<PlaceAutocompleteElement>(null)
    const shadowInputRef = useRef<PlaceAutocompleteElement["Dg"]>(null)
    const shadowDialogRef = useRef<PlaceAutocompleteElement["Eg"]>(null)
    const validityHandlerRef = useRef<(e: SubmitEvent) => any>(null)
    const gmpSelectHandlerRef = useRef<(e: AutocompleteSuggestion) => any>(null)
    const gmpErrorHandlerRef = useRef<(e: any) => any>(null)
    const gmpChangeHandlerRef = useRef<(e: any) => any>(null)
    const loadStateRef = useRef<null | "loaded" | "done">(null)
    let [place, setPlace] = usePlace()

    // build on init
    useEffect(() => {
        /**
         * Load the Google Maps JS API
         * https://developers.google.com/maps/documentation/javascript/load-maps-js-api
         */
        const loadPlaces = async () => {
            if (!window?.google?.maps?.importLibrary) {
                const script = document.createElement("script")
                script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:"${props.apiKey}",v:"weekly"});`
                document.head.appendChild(script)
            }
            loadStateRef.current = "loaded"
        }

        /**
         * Build and add the Google Autocomplete Element to the page
         * https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement
         */
        const setupAutocomplete = async () => {
            if (!internalRef.current || !window?.google) return

            // Ensure places library is loaded
            await window.google.maps.importLibrary("places")

            const autocompleteElement =
                new window.google.maps.places.PlaceAutocompleteElement(options)

            // set refs
            autocompleteElementRef.current = autocompleteElement
            shadowInputRef.current = autocompleteElement.Dg
            shadowDialogRef.current = autocompleteElement.Eg
            parentFormRef.current = internalRef.current.closest("form")

            // set styles
            autocompleteElement.style.backgroundColor = backgroundColor
            autocompleteElement.style.border = `${border.borderStyle} ${border.borderWidth}px ${border.borderColor}`
            autocompleteElement.style["border-radius"] = borderRadius
            autocompleteElement.style.colorScheme = colorScheme
            autocompleteElement.style.width = props.width
            autocompleteElement.name = name

            // mount the field
            internalRef.current.appendChild(autocompleteElement)

            loadStateRef.current = "done"
            console.log(
                autocompleteElementRef.current,
                shadowDialogRef.current,
                shadowInputRef.current,
                parentFormRef.current
            )
        }

        /**
         * Necessary (but hacky) overrides due to Google limitations
         * https://stackoverflow.com/q/79556333/4481226
         */
        const overrideShadow = () => {
            /** Set a placeholder on the shadowDOM input */
            const applyPlaceholder = () => {
                if (overrides?.placeholder == "") return
                shadowInput.placeholder = overrides.placeholder
            }

            /** Set the shadowDOM input as required */
            const applyRequired = () => {
                if (!overrides?.required) return

                shadowInput.required = overrides.required

                validityHandlerRef.current = (e) => {
                    e.preventDefault()
                    let isValid = shadowInput.reportValidity()
                    !isValid && e.stopImmediatePropagation()
                }

                parentFormRef.current.addEventListener(
                    "submit",
                    validityHandlerRef.current
                )
            }

            /** Set the shadowDOM input to require a Google place selection */
            const applyPlaceOnly = () => {
                if (!overrides?.placeOnly) return

                gmpSelectHandlerRef.current = (e) => {
                    let mainText = e.placePrediction.mainText.text
                    let secondaryText = e.placePrediction.secondaryText.text
                    let text = e.placePrediction.text.text
                    let id = e.placePrediction.placeId
                    setPlace({ mainText, secondaryText, text, id })
                }
                gmpErrorHandlerRef.current = () => {
                    setPlace({})
                    shadowInput.value = ""
                }
                gmpChangeHandlerRef.current = () => {
                    if (shadowInput.value != place?.text)
                        shadowInput.value = place?.text ?? ""
                }

                internalRef.current.addEventListener(
                    "gmp-select",
                    gmpSelectHandlerRef.current
                )
                internalRef.current.addEventListener(
                    "gmp-error",
                    gmpErrorHandlerRef.current
                )
                shadowInput.addEventListener(
                    "change",
                    gmpChangeHandlerRef.current
                )
            }

            // pre check
            if (
                !overrides ||
                !internalRef.current ||
                !parentFormRef.current ||
                !autocompleteElementRef.current
            )
                return

            const shadowInput = autocompleteElementRef.current["Dg"]
            const shadowDialog = autocompleteElementRef.current["Eg"]

            applyPlaceholder()
            applyRequired()
            applyPlaceOnly()
        }

        const effectOperations = async () => {
            try {
                loadStateRef.current == null && (await loadPlaces())
                loadStateRef.current === "loaded" && (await setupAutocomplete())
                loadStateRef.current === "done" && overrideShadow()
            } catch (e) {
                console.error(e)
            }
        }
        effectOperations()

        return () => {
            validityHandlerRef.current &&
                parentFormRef?.current.removeEventListener(
                    "submit",
                    validityHandlerRef.current
                )
            gmpSelectHandlerRef.current &&
                autocompleteElementRef?.current.removeEventListener(
                    "gmp-select",
                    gmpSelectHandlerRef.current
                )
            gmpErrorHandlerRef.current &&
                autocompleteElementRef?.current.removeEventListener(
                    "gmp-error",
                    gmpErrorHandlerRef.current
                )
            gmpChangeHandlerRef.current &&
                autocompleteElementRef?.current.removeEventListener(
                    "change",
                    gmpChangeHandlerRef.current
                )
        }
    }, [place])

    return (
        <div ref={internalRef} {...restProps}>
            {props.children}
        </div>
    )
}

/** Creates an element from a string */
function elementFromString(content: string) {
    const template = document.createElement("template")
    template.innerHTML = content
    return template.content.firstElementChild
}

GoogleMapsAutocomplete.defaultProps = {
    showUnitSystem: false,
}

/** https://www.framer.com/developers/property-controls */
addPropertyControls(GoogleMapsAutocomplete, {
    apiKey: {
        title: "API Key",
        type: ControlType.String,
        placeholder: "missing (required)",
        description:
            "Enable the Places API (New). [Instructions](https://developers.google.com/maps/documentation/places/web-service/get-api-key?setupProd=enable)",
    },
    options: {
        type: ControlType.Object,
        optional: true,
        buttonTitle: "enabled",
        description:
            "All [autocomplete properties](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement-Properties) (scrolling list)",
        controls: {
            includedPrimaryTypes: {
                title: "Types",
                type: ControlType.Array,
                description: "Up to 5 Google Place type limits",
                maxCount: 5,
                control: {
                    type: ControlType.String,
                    title: "Google Place Type",
                    placeholder: "ex: cultural_landmark",
                    description:
                        "A [Google place type](https://developers.google.com/maps/documentation/javascript/place-types)",
                },
            },
            includedRegionCodes: {
                title: "Regions",
                type: ControlType.Array,
                description: "Up to 15 region limits",
                maxCount: 15,
                control: {
                    type: ControlType.String,
                    title: "Region",
                    placeholder: "ex: PL",
                    maxLength: 2,
                    description:
                        "A [two-character region](https://www.unicode.org/cldr/charts/47/supplemental/territory_language_information.html)",
                },
            },
            locationBias: {
                title: "Bias",
                type: ControlType.Object,
                optional: true,
                description: "Bias results to a specified location",
                controls: {
                    lat: {
                        type: ControlType.Number,
                        min: -90,
                        max: 90,
                    },
                    lng: {
                        type: ControlType.Number,
                        min: -180,
                        max: 180,
                    },
                },
            },
            locationRestriction: {
                title: "Restriction",
                type: ControlType.Object,
                optional: true,
                description: "Restrict results to the specified bounds",
                controls: {
                    north: {
                        type: ControlType.Number,
                        min: -90,
                        max: 90,
                    },
                    east: {
                        type: ControlType.Number,
                        min: -180,
                        max: 180,
                    },
                    south: {
                        type: ControlType.Number,
                        min: -90,
                        max: 90,
                    },
                    west: {
                        type: ControlType.Number,
                        min: -180,
                        max: 180,
                    },
                },
            },
            origin: {
                type: ControlType.Object,
                optional: true,
                description: "The origin from which to calculate distance",
                controls: {
                    lat: {
                        type: ControlType.Number,
                        min: -90,
                        max: 90,
                    },
                    lng: {
                        type: ControlType.Number,
                        min: -180,
                        max: 180,
                    },
                },
            },
            requestedLanguage: {
                title: "Language",
                type: ControlType.String,
                optional: true,
                placeholder: "ex: pt-BR",
                description:
                    "Language of the results ([view code list](https://developers.google.com/maps/faq#languagesupport))",
            },
            requestedRegion: {
                title: "Format",
                type: ControlType.String,
                optional: true,
                placeholder: "ex: uk",
                description:
                    "Format results according to [ccTLD](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement.requestedRegion) region",
            },
            unitSystem: {
                type: ControlType.Enum,
                options: [undefined, "METRIC", "IMPERIAL"],
            },
        },
    },
    colorScheme: {
        type: ControlType.Enum,
        defaultValue: "light dark",
        // displaySegmentedControl: true,
        // segmentedControlDirection: "vertical",
        options: ["light", "dark", "light dark"],
        // optionTitles: ["Option A", "Option B", "Option C"],
        description: "Style changes may require page reload",
    },
    name: {
        type: ControlType.String,
        defaultValue: "location",
        description:
            "Name of the form input (used to attach result to [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#form))",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#fff",
        optional: true,
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
    },
    border: {
        type: ControlType.Border,
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid", // solid, dashed, dotted or double
            borderColor: "rgba(0, 0, 0, 0.5)",
        },
    },
    overrides: {
        title: "Extras",
        buttonTitle: "enabled",
        type: ControlType.Object,
        optional: true,
        description:
            "Options to overcome [Google's limitations](https://stackoverflow.com/a/79590414/4481226).",
        controls: {
            placeholder: {
                type: ControlType.String,
                placeholder: "search for a location...",
                description: "Helps a user understand what this field does",
            },
            required: {
                type: ControlType.Boolean,
                defaultValue: false,
                description: "Require a place from the user",
            },
            placeOnly: {
                type: ControlType.Boolean,
                defaultValue: false,
                description:
                    "Disallow the user from entereing a hand-typed answer",
            },
        },
    },
})

declare global {
    interface Window {
        google?: {
            maps: {
                importLibrary: (name: string) => Promise<unknown>
                places: {
                    PlaceAutocompleteElement: new (
                        options?: AutocompleteRequest
                    ) => PlaceAutocompleteElement
                }
            }
        }
    }
}

/**
 * See [Google documentation](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElementOptions)
 */
interface AutocompleteRequest {
    /**
     * Included primary <a
     * href="https://developers.google.com/maps/documentation/javascript/place-types">Place
     * type</a> (for example, &quot;restaurant&quot; or
     * &quot;gas_station&quot;). <br/><br/> A Place is only returned if its
     * primary type is included in this list. Up to 5 values can be specified.
     * If no types are specified, all Place types are returned.
     */
    includedPrimaryTypes?: string[]
    /**
     * Only include results in the specified regions, specified as up to 15 CLDR
     * two-character region codes. An empty set will not restrict the results.
     * If both <code>locationRestriction</code> and
     * <code>includedRegionCodes</code> are set, the results will be located in
     * the area of intersection.
     */
    includedRegionCodes?: string[]
    /**
     * The text string on which to search.
     */
    input: string
    /**
     * A zero-based Unicode character offset of <code>input</code> indicating
     * the cursor position in <code>input</code>. The cursor position may
     * influence what predictions are returned. If not specified, defaults to
     * the length of <code>input</code>.
     */
    inputOffset?: number
    /**
     * The language in which to return results. Will default to the
     * browser&#39;s language preference. The results may be in mixed languages
     * if the language used in <code>input</code> is different from
     * <code>language</code>, or if the returned Place does not have a
     * translation from the local language to <code>language</code>.
     */
    language?: string
    /**
     * Bias results to a specified location. <br/><br/> At most one of
     * <code>locationBias</code> or <code>locationRestriction</code> should be
     * set. If neither are set, the results will be biased by IP address,
     * meaning the IP address will be mapped to an imprecise location and used
     * as a biasing signal.
     */
    locationBias?: string
    /**
     * Restrict results to a specified location. <br/><br/> At most one of
     * <code>locationBias</code> or <code>locationRestriction</code> should be
     * set. If neither are set, the results will be biased by IP address,
     * meaning the IP address will be mapped to an imprecise location and used
     * as a biasing signal.
     */
    locationRestriction?: LatLngBoundsLiteral
    /**
     * The origin point from which to calculate geodesic distance to the
     * destination (returned as {@link
     * google.maps.places.PlacePrediction.distanceMeters}). If this value is
     * omitted, geodesic distance will not be returned.
     */
    origin?: LatLngLiteral
    /**
     * The region code, specified as a CLDR two-character region code. This
     * affects address formatting, result ranking, and may influence what
     * results are returned. This does not restrict results to the specified
     * region.
     */
    region?: string
}

/**
 * See [Google documentation](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement) and [Github reference](https://github.com/googlemaps/js-types/blob/7bb78f50e588b8c185fee9386041761c9b9aa861/index.d.ts#L14822)
 */
interface PlaceAutocompleteElement extends HTMLElement {
    /** See [Google documentation](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement-Properties) */
    name: string
    /** see [Google documentation](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement-CSS-Properties) */
    style: HTMLElement["style"] & {
        /** See [Google documentation](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement-CSS-Properties) */
        colorScheme: string
    }
    /** The shadow HTML Input element. See https://stackoverflow.com/a/79719999/4481226 */
    Dg?: HTMLInputElement | null

    /** The shadow HTML Dialog element. See https://stackoverflow.com/a/79719999/4481226 */
    Eg?: HTMLDialogElement | null
}

interface AutocompleteSuggestion extends Event {
    /**
     * Contains the human-readable name for the returned result. For
     * establishment results, this is usually the business name and address.
     */
    placePrediction: PlacePrediction | null
}

interface PlacePrediction extends Event {
    /**
     * The length of the geodesic in meters from <code>origin</code> if
     * <code>origin</code> is specified.
     */
    distanceMeters: number | null
    /**
     * Represents the name of the Place.
     */
    mainText: { text: string }
    /**
     * The unique identifier of the suggested Place. This identifier can be used
     * in other APIs that accept Place IDs.
     */
    placeId: string
    /**
     * Represents additional disambiguating features (such as a city or region)
     * to further identify the Place.
     */
    secondaryText: { text: string | null } | null
    /**
     * Contains the human-readable name for the returned result. For
     * establishment results, this is usually the business name and address.
     * <br/><br/> <code>text</code> is recommended for developers who wish to
     * show a single UI element. Developers who wish to show two separate, but
     * related, UI elements may want to use {@link
     * google.maps.places.PlacePrediction.mainText} and {@link
     * google.maps.places.PlacePrediction.secondaryText} instead.
     */
    text: { text: string }
    /**
     * Returns a Place representation of this PlacePrediction. A subsequent call
     * to {@link google.maps.places.Place.fetchFields} is required to get full
     * Place details. It initially only contains the place id.
     */
    toPlace(): any
    /**
     * List of types that apply to this Place from Table A or Table B in <a
     * href="https://developers.google.com/maps/documentation/places/web-service/place-types">https://developers.google.com/maps/documentation/places/web-service/place-types</a>.
     */
    types: string[]
}

/** {@see https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngLiteral } */
interface LatLngLiteral {
    /**
     * Latitude in degrees. Values will be clamped to the range [-90, 90]. This
     * means that if the value specified is less than -90, it will be set to
     * -90. And if the value is greater than 90, it will be set to 90.
     */
    lat: number
    /**
     * Longitude in degrees. Values outside the range [-180, 180] will be
     * wrapped so that they fall within the range. For example, a value of -190
     * will be converted to 170. A value of 190 will be converted to -170. This
     * reflects the fact that longitudes wrap around the globe.
     */
    lng: number
}

/** {@see https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLngBoundsLiteral }*/
interface LatLngBoundsLiteral {
    /**
     * East longitude in degrees. Values outside the range [-180, 180] will be
     * wrapped to the range [-180, 180). For example, a value of -190 will be
     * converted to 170. A value of 190 will be converted to -170. This reflects
     * the fact that longitudes wrap around the globe.
     */
    east: number
    /**
     * North latitude in degrees. Values will be clamped to the range [-90, 90].
     * This means that if the value specified is less than -90, it will be set
     * to -90. And if the value is greater than 90, it will be set to 90.
     */
    north: number
    /**
     * South latitude in degrees. Values will be clamped to the range [-90, 90].
     * This means that if the value specified is less than -90, it will be set
     * to -90. And if the value is greater than 90, it will be set to 90.
     */
    south: number
    /**
     * West longitude in degrees. Values outside the range [-180, 180] will be
     * wrapped to the range [-180, 180). For example, a value of -190 will be
     * converted to 170. A value of 190 will be converted to -170. This reflects
     * the fact that longitudes wrap around the globe.
     */
    west: number
}

type CreateStore<T> = () => [T, Dispatch<SetStateAction<T>>]
