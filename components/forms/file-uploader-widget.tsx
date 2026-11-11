/**
 * File Uploader Widget for Framer.
 * It contains the core bundle from Uploadcare File Uploader\
 * With external source like dropbox, gdrive, gphotos, box, onedrive and local
 */

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
    createElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"
import type { CSSProperties } from "react"

// ─── Constants ─────────────────────────────
const UC_STYLES_ID = "uc-file-uploader-styles"

// https://github.com/uploadcare/file-uploader
const UC_BUNDLE_JS = Promise.resolve().then(() => {
    var __defProp = Object.defineProperty
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor
    var __export = (target, all) => {
        for (var name in all)
            __defProp(target, name, { get: all[name], enumerable: true })
    }
    var __decorateClass = (decorators, target, key, kind) => {
        var result =
            kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target
        for (var i12 = decorators.length - 1, decorator; i12 >= 0; i12--)
            if ((decorator = decorators[i12]))
                result =
                    (kind
                        ? decorator(target, key, result)
                        : decorator(result)) || result
        if (kind && result) __defProp(target, key, result)
        return result
    }

    // node_modules/nanostores/atom/index.js
    var listenerQueue = []
    var lqIndex = 0
    var QUEUE_ITEMS_PER_LISTENER = 4
    var atom = /* @__NO_SIDE_EFFECTS__ */ (initialValue) => {
        let listeners = []
        let $atom = {
            get() {
                if (!$atom.lc) {
                    $atom.listen(() => {})()
                }
                return $atom.value
            },
            lc: 0,
            listen(listener) {
                $atom.lc = listeners.push(listener)
                return () => {
                    for (
                        let i12 = lqIndex + QUEUE_ITEMS_PER_LISTENER;
                        i12 < listenerQueue.length;

                    ) {
                        if (listenerQueue[i12] === listener) {
                            listenerQueue.splice(i12, QUEUE_ITEMS_PER_LISTENER)
                        } else {
                            i12 += QUEUE_ITEMS_PER_LISTENER
                        }
                    }
                    let index = listeners.indexOf(listener)
                    if (~index) {
                        listeners.splice(index, 1)
                        if (!--$atom.lc) $atom.off()
                    }
                }
            },
            notify(oldValue, changedKey) {
                let runListenerQueue = !listenerQueue.length
                for (let listener of listeners) {
                    listenerQueue.push(
                        listener,
                        $atom.value,
                        oldValue,
                        changedKey
                    )
                }
                if (runListenerQueue) {
                    for (
                        lqIndex = 0;
                        lqIndex < listenerQueue.length;
                        lqIndex += QUEUE_ITEMS_PER_LISTENER
                    ) {
                        listenerQueue[lqIndex](
                            listenerQueue[lqIndex + 1],
                            listenerQueue[lqIndex + 2],
                            listenerQueue[lqIndex + 3]
                        )
                    }
                    listenerQueue.length = 0
                }
            },
            /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
            off() {},
            set(newValue) {
                let oldValue = $atom.value
                if (oldValue !== newValue) {
                    $atom.value = newValue
                    $atom.notify(oldValue)
                }
            },
            subscribe(listener) {
                let unbind = $atom.listen(listener)
                listener($atom.value)
                return unbind
            },
            value: initialValue,
        }
        return $atom
    }

    // node_modules/nanostores/listen-keys/index.js
    function listenKeys($store, keys, listener) {
        let keysSet = new Set(keys).add(void 0)
        return $store.listen((value, oldValue, changed) => {
            if (keysSet.has(changed)) {
                listener(value, oldValue, changed)
            }
        })
    }
    function subscribeKeys($store, keys, listener) {
        let unbind = listenKeys($store, keys, listener)
        listener($store.value)
        return unbind
    }

    // node_modules/nanostores/map/index.js
    var map = /* @__NO_SIDE_EFFECTS__ */ (initial = {}) => {
        let $map = atom(initial)
        $map.setKey = function (key, value) {
            let oldMap = $map.value
            if (typeof value === "undefined" && key in $map.value) {
                $map.value = { ...$map.value }
                delete $map.value[key]
                $map.notify(oldMap, key)
            } else if ($map.value[key] !== value) {
                $map.value = {
                    ...$map.value,
                    [key]: value,
                }
                $map.notify(oldMap, key)
            }
        }
        return $map
    }

    // src/lit/PubSubCompat.ts
    var PubSub = class _PubSub {
        static {
            this.ub = /* @__PURE__ */ new Map()
        }
        constructor(_ctxId, store) {
            this.ba = _ctxId
            this.ia = store
        }
        get id() {
            return this.ba
        }
        pub(key, value) {
            if (!(key in this.ia.get())) {
                console.warn(`PubSub#pub: Key "${String(key)}" not found`)
            }
            this.ia.setKey(key, value)
        }
        sub(key, callback, init = true) {
            const unsubscribe = (init ? subscribeKeys : listenKeys)(
                this.ia,
                [key],
                (values) => {
                    callback(values[key])
                }
            )
            return unsubscribe
        }
        read(key) {
            if (!(key in this.ia.get())) {
                console.warn(`PubSub#read: Key "${String(key)}" not found`)
            }
            return this.ia.get()[key]
        }
        add(key, value, rewrite = false) {
            const exists = key in this.ia.get()
            if (!exists || rewrite) {
                this.ia.setKey(key, value)
            }
        }
        has(key) {
            return key in this.ia.get()
        }
        get store() {
            return this.ia.get()
        }
        static registerCtx(initialValue, ctxId) {
            if (_PubSub.ub.has(ctxId)) {
                throw new Error(
                    `PubSub: Context with id "${ctxId}" already exists`
                )
            }
            const store = map(initialValue)
            _PubSub.ub.set(ctxId, store)
            return new _PubSub(ctxId, store)
        }
        static deleteCtx(ctxId) {
            _PubSub.ub.delete(ctxId)
        }
        static getCtx(ctxId) {
            const store = _PubSub.ub.get(ctxId)
            if (!store) {
                return null
            }
            return new _PubSub(ctxId, store)
        }
        static hasCtx(ctxId) {
            return _PubSub.ub.has(ctxId)
        }
    }

    // node_modules/@lit/reactive-element/css-tag.js
    var t = globalThis
    var e =
        t.ShadowRoot &&
        (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) &&
        "adoptedStyleSheets" in Document.prototype &&
        "replace" in CSSStyleSheet.prototype
    var s = /* @__PURE__ */ Symbol()
    var o = /* @__PURE__ */ new WeakMap()
    var n = class {
        constructor(t7, e11, o14) {
            if (((this.qi = true), o14 !== s))
                throw Error(
                    "CSSResult is not constructable. Use `unsafeCSS` or `css` instead."
                )
            ;((this.cssText = t7), (this.t = e11))
        }
        get styleSheet() {
            let t7 = this.o
            const s11 = this.t
            if (e && void 0 === t7) {
                const e11 = void 0 !== s11 && 1 === s11.length
                ;(e11 && (t7 = o.get(s11)),
                    void 0 === t7 &&
                        ((this.o = t7 = new CSSStyleSheet()).replaceSync(
                            this.cssText
                        ),
                        e11 && o.set(s11, t7)))
            }
            return t7
        }
        toString() {
            return this.cssText
        }
    }
    var r = (t7) => new n("string" == typeof t7 ? t7 : t7 + "", void 0, s)
    var S = (s11, o14) => {
        if (e)
            s11.adoptedStyleSheets = o14.map((t7) =>
                t7 instanceof CSSStyleSheet ? t7 : t7.styleSheet
            )
        else
            for (const e11 of o14) {
                const o15 = document.createElement("style"),
                    n10 = t.litNonce
                ;(void 0 !== n10 && o15.setAttribute("nonce", n10),
                    (o15.textContent = e11.cssText),
                    s11.appendChild(o15))
            }
    }
    var c = e
        ? (t7) => t7
        : (t7) =>
              t7 instanceof CSSStyleSheet
                  ? ((t8) => {
                        let e11 = ""
                        for (const s11 of t8.cssRules) e11 += s11.cssText
                        return r(e11)
                    })(t7)
                  : t7

    // node_modules/@lit/reactive-element/reactive-element.js
    var {
        is: i2,
        defineProperty: e2,
        getOwnPropertyDescriptor: h,
        getOwnPropertyNames: r2,
        getOwnPropertySymbols: o2,
        getPrototypeOf: n2,
    } = Object
    var a = globalThis
    var c2 = a.trustedTypes
    var l = c2 ? c2.emptyScript : ""
    var p = a.reactiveElementPolyfillSupport
    var d = (t7, s11) => t7
    var u = {
        toAttribute(t7, s11) {
            switch (s11) {
                case Boolean:
                    t7 = t7 ? l : null
                    break
                case Object:
                case Array:
                    t7 = null == t7 ? t7 : JSON.stringify(t7)
            }
            return t7
        },
        fromAttribute(t7, s11) {
            let i12 = t7
            switch (s11) {
                case Boolean:
                    i12 = null !== t7
                    break
                case Number:
                    i12 = null === t7 ? null : Number(t7)
                    break
                case Object:
                case Array:
                    try {
                        i12 = JSON.parse(t7)
                    } catch (t8) {
                        i12 = null
                    }
            }
            return i12
        },
    }
    var f = (t7, s11) => !i2(t7, s11)
    var b = {
        attribute: true,
        type: String,
        converter: u,
        reflect: false,
        useDefault: false,
        hasChanged: f,
    }
    ;((Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata")),
        (a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap()))
    var y = class extends HTMLElement {
        static addInitializer(t7) {
            ;(this.fd(), (this.l ??= []).push(t7))
        }
        static get observedAttributes() {
            return (this.finalize(), this.$b && [...this.$b.keys()])
        }
        static createProperty(t7, s11 = b) {
            if (
                (s11.state && (s11.attribute = false),
                this.fd(),
                this.prototype.hasOwnProperty(t7) &&
                    ((s11 = Object.create(s11)).wrapped = true),
                this.elementProperties.set(t7, s11),
                !s11.noAccessor)
            ) {
                const i12 = /* @__PURE__ */ Symbol(),
                    h8 = this.getPropertyDescriptor(t7, i12, s11)
                void 0 !== h8 && e2(this.prototype, t7, h8)
            }
        }
        static getPropertyDescriptor(t7, s11, i12) {
            const { get: e11, set: r8 } = h(this.prototype, t7) ?? {
                get() {
                    return this[s11]
                },
                set(t8) {
                    this[s11] = t8
                },
            }
            return {
                get: e11,
                set(s12) {
                    const h8 = e11?.call(this)
                    ;(r8?.call(this, s12), this.requestUpdate(t7, h8, i12))
                },
                configurable: true,
                enumerable: true,
            }
        }
        static getPropertyOptions(t7) {
            return this.elementProperties.get(t7) ?? b
        }
        static fd() {
            if (this.hasOwnProperty(d("elementProperties"))) return
            const t7 = n2(this)
            ;(t7.finalize(),
                void 0 !== t7.l && (this.l = [...t7.l]),
                (this.elementProperties = new Map(t7.elementProperties)))
        }
        static finalize() {
            if (this.hasOwnProperty(d("finalized"))) return
            if (
                ((this.finalized = true),
                this.fd(),
                this.hasOwnProperty(d("properties")))
            ) {
                const t8 = this.properties,
                    s11 = [...r2(t8), ...o2(t8)]
                for (const i12 of s11) this.createProperty(i12, t8[i12])
            }
            const t7 = this[Symbol.metadata]
            if (null !== t7) {
                const s11 = litPropertyMetadata.get(t7)
                if (void 0 !== s11)
                    for (const [t8, i12] of s11)
                        this.elementProperties.set(t8, i12)
            }
            this.$b = /* @__PURE__ */ new Map()
            for (const [t8, s11] of this.elementProperties) {
                const i12 = this.gd(t8, s11)
                void 0 !== i12 && this.$b.set(i12, t8)
            }
            this.elementStyles = this.finalizeStyles(this.styles)
        }
        static finalizeStyles(s11) {
            const i12 = []
            if (Array.isArray(s11)) {
                const e11 = new Set(s11.flat(1 / 0).reverse())
                for (const s12 of e11) i12.unshift(c(s12))
            } else void 0 !== s11 && i12.push(c(s11))
            return i12
        }
        static gd(t7, s11) {
            const i12 = s11.attribute
            return false === i12
                ? void 0
                : "string" == typeof i12
                  ? i12
                  : "string" == typeof t7
                    ? t7.toLowerCase()
                    : void 0
        }
        constructor() {
            ;(super(),
                (this.ac = void 0),
                (this.isUpdatePending = false),
                (this.hasUpdated = false),
                (this.Ya = null),
                this.ri())
        }
        ri() {
            ;((this.hd = new Promise((t7) => (this.enableUpdating = t7))),
                (this.Ha = /* @__PURE__ */ new Map()),
                this.si(),
                this.requestUpdate(),
                this.constructor.l?.forEach((t7) => t7(this)))
        }
        addController(t7) {
            ;((this.vb ??= /* @__PURE__ */ new Set()).add(t7),
                void 0 !== this.renderRoot &&
                    this.isConnected &&
                    t7.hostConnected?.())
        }
        removeController(t7) {
            this.vb?.delete(t7)
        }
        si() {
            const t7 = /* @__PURE__ */ new Map(),
                s11 = this.constructor.elementProperties
            for (const i12 of s11.keys())
                this.hasOwnProperty(i12) &&
                    (t7.set(i12, this[i12]), delete this[i12])
            t7.size > 0 && (this.ac = t7)
        }
        createRenderRoot() {
            const t7 =
                this.shadowRoot ??
                this.attachShadow(this.constructor.shadowRootOptions)
            return (S(t7, this.constructor.elementStyles), t7)
        }
        connectedCallback() {
            ;((this.renderRoot ??= this.createRenderRoot()),
                this.enableUpdating(true),
                this.vb?.forEach((t7) => t7.hostConnected?.()))
        }
        enableUpdating(t7) {}
        disconnectedCallback() {
            this.vb?.forEach((t7) => t7.hostDisconnected?.())
        }
        attributeChangedCallback(t7, s11, i12) {
            this.jd(t7, i12)
        }
        ti(t7, s11) {
            const i12 = this.constructor.elementProperties.get(t7),
                e11 = this.constructor.gd(t7, i12)
            if (void 0 !== e11 && true === i12.reflect) {
                const h8 = (
                    void 0 !== i12.converter?.toAttribute ? i12.converter : u
                ).toAttribute(s11, i12.type)
                ;((this.Ya = t7),
                    null == h8
                        ? this.removeAttribute(e11)
                        : this.setAttribute(e11, h8),
                    (this.Ya = null))
            }
        }
        jd(t7, s11) {
            const i12 = this.constructor,
                e11 = i12.$b.get(t7)
            if (void 0 !== e11 && this.Ya !== e11) {
                const t8 = i12.getPropertyOptions(e11),
                    h8 =
                        "function" == typeof t8.converter
                            ? { fromAttribute: t8.converter }
                            : void 0 !== t8.converter?.fromAttribute
                              ? t8.converter
                              : u
                this.Ya = e11
                const r8 = h8.fromAttribute(s11, t8.type)
                ;((this[e11] = r8 ?? this.kd?.get(e11) ?? r8), (this.Ya = null))
            }
        }
        requestUpdate(t7, s11, i12, e11 = false, h8) {
            if (void 0 !== t7) {
                const r8 = this.constructor
                if (
                    (false === e11 && (h8 = this[t7]),
                    (i12 ??= r8.getPropertyOptions(t7)),
                    !(
                        (i12.hasChanged ?? f)(h8, s11) ||
                        (i12.useDefault &&
                            i12.reflect &&
                            h8 === this.kd?.get(t7) &&
                            !this.hasAttribute(r8.gd(t7, i12)))
                    ))
                )
                    return
                this.C(t7, s11, i12)
            }
            false === this.isUpdatePending && (this.hd = this.ui())
        }
        C(t7, s11, { useDefault: i12, reflect: e11, wrapped: h8 }, r8) {
            ;(i12 &&
                !(this.kd ??= /* @__PURE__ */ new Map()).has(t7) &&
                (this.kd.set(t7, r8 ?? s11 ?? this[t7]),
                true !== h8 || void 0 !== r8)) ||
                (this.Ha.has(t7) ||
                    (this.hasUpdated || i12 || (s11 = void 0),
                    this.Ha.set(t7, s11)),
                true === e11 &&
                    this.Ya !== t7 &&
                    (this.gf ??= /* @__PURE__ */ new Set()).add(t7))
        }
        async ui() {
            this.isUpdatePending = true
            try {
                await this.hd
            } catch (t8) {
                Promise.reject(t8)
            }
            const t7 = this.scheduleUpdate()
            return (null != t7 && (await t7), !this.isUpdatePending)
        }
        scheduleUpdate() {
            return this.performUpdate()
        }
        performUpdate() {
            if (!this.isUpdatePending) return
            if (!this.hasUpdated) {
                if (((this.renderRoot ??= this.createRenderRoot()), this.ac)) {
                    for (const [t9, s12] of this.ac) this[t9] = s12
                    this.ac = void 0
                }
                const t8 = this.constructor.elementProperties
                if (t8.size > 0)
                    for (const [s12, i12] of t8) {
                        const { wrapped: t9 } = i12,
                            e11 = this[s12]
                        true !== t9 ||
                            this.Ha.has(s12) ||
                            void 0 === e11 ||
                            this.C(s12, void 0, i12, e11)
                    }
            }
            let t7 = false
            const s11 = this.Ha
            try {
                ;((t7 = this.shouldUpdate(s11)),
                    t7
                        ? (this.willUpdate(s11),
                          this.vb?.forEach((t8) => t8.hostUpdate?.()),
                          this.update(s11))
                        : this.ld())
            } catch (s12) {
                throw ((t7 = false), this.ld(), s12)
            }
            t7 && this.vi(s11)
        }
        willUpdate(t7) {}
        vi(t7) {
            ;(this.vb?.forEach((t8) => t8.hostUpdated?.()),
                this.hasUpdated ||
                    ((this.hasUpdated = true), this.firstUpdated(t7)),
                this.updated(t7))
        }
        ld() {
            ;((this.Ha = /* @__PURE__ */ new Map()),
                (this.isUpdatePending = false))
        }
        get updateComplete() {
            return this.getUpdateComplete()
        }
        getUpdateComplete() {
            return this.hd
        }
        shouldUpdate(t7) {
            return true
        }
        update(t7) {
            ;((this.gf &&= this.gf.forEach((t8) => this.ti(t8, this[t8]))),
                this.ld())
        }
        updated(t7) {}
        firstUpdated(t7) {}
    }
    ;((y.elementStyles = []),
        (y.shadowRootOptions = { mode: "open" }),
        (y[d("elementProperties")] = /* @__PURE__ */ new Map()),
        (y[d("finalized")] = /* @__PURE__ */ new Map()),
        p?.({ ReactiveElement: y }),
        (a.reactiveElementVersions ??= []).push("2.1.2"))

    // node_modules/lit-html/lit-html.js
    var t2 = globalThis
    var i3 = (t7) => t7
    var s2 = t2.trustedTypes
    var e3 = s2
        ? s2.createPolicy("lit-html", { createHTML: (t7) => t7 })
        : void 0
    var h2 = "$lit$"
    var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`
    var n3 = "?" + o3
    var r3 = `<${n3}>`
    var l2 = document
    var c3 = () => l2.createComment("")
    var a2 = (t7) =>
        null === t7 || ("object" != typeof t7 && "function" != typeof t7)
    var u2 = Array.isArray
    var d2 = (t7) => u2(t7) || "function" == typeof t7?.[Symbol.iterator]
    var f2 = "[ 	\n\f\r]"
    var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g
    var _ = /-->/g
    var m = />/g
    var p2 = RegExp(
        `>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,
        "g"
    )
    var g = /'/g
    var $ = /"/g
    var y2 = /^(?:script|style|textarea|title)$/i
    var x =
        (t7) =>
        (i12, ...s11) => ({ va: t7, strings: i12, values: s11 })
    var b2 = x(1)
    var E = /* @__PURE__ */ Symbol.for("lit-noChange")
    var A = /* @__PURE__ */ Symbol.for("lit-nothing")
    var C = /* @__PURE__ */ new WeakMap()
    var P = l2.createTreeWalker(l2, 129)
    function V(t7, i12) {
        if (!u2(t7) || !t7.hasOwnProperty("raw"))
            throw Error("invalid template strings array")
        return void 0 !== e3 ? e3.createHTML(i12) : i12
    }
    var N = (t7, i12) => {
        const s11 = t7.length - 1,
            e11 = []
        let n10,
            l5 = 2 === i12 ? "<svg>" : 3 === i12 ? "<math>" : "",
            c11 = v
        for (let i13 = 0; i13 < s11; i13++) {
            const s12 = t7[i13]
            let a6,
                u6,
                d7 = -1,
                f7 = 0
            for (
                ;
                f7 < s12.length &&
                ((c11.lastIndex = f7), (u6 = c11.exec(s12)), null !== u6);

            )
                ((f7 = c11.lastIndex),
                    c11 === v
                        ? "!--" === u6[1]
                            ? (c11 = _)
                            : void 0 !== u6[1]
                              ? (c11 = m)
                              : void 0 !== u6[2]
                                ? (y2.test(u6[2]) &&
                                      (n10 = RegExp("</" + u6[2], "g")),
                                  (c11 = p2))
                                : void 0 !== u6[3] && (c11 = p2)
                        : c11 === p2
                          ? ">" === u6[0]
                              ? ((c11 = n10 ?? v), (d7 = -1))
                              : void 0 === u6[1]
                                ? (d7 = -2)
                                : ((d7 = c11.lastIndex - u6[2].length),
                                  (a6 = u6[1]),
                                  (c11 =
                                      void 0 === u6[3]
                                          ? p2
                                          : '"' === u6[3]
                                            ? $
                                            : g))
                          : c11 === $ || c11 === g
                            ? (c11 = p2)
                            : c11 === _ || c11 === m
                              ? (c11 = v)
                              : ((c11 = p2), (n10 = void 0)))
            const x2 = c11 === p2 && t7[i13 + 1].startsWith("/>") ? " " : ""
            l5 +=
                c11 === v
                    ? s12 + r3
                    : d7 >= 0
                      ? (e11.push(a6),
                        s12.slice(0, d7) + h2 + s12.slice(d7) + o3 + x2)
                      : s12 + o3 + (-2 === d7 ? i13 : x2)
        }
        return [
            V(
                t7,
                l5 +
                    (t7[s11] || "<?>") +
                    (2 === i12 ? "</svg>" : 3 === i12 ? "</math>" : "")
            ),
            e11,
        ]
    }
    var S2 = class _S {
        constructor({ strings: t7, va: i12 }, e11) {
            let r8
            this.parts = []
            let l5 = 0,
                a6 = 0
            const u6 = t7.length - 1,
                d7 = this.parts,
                [f7, v3] = N(t7, i12)
            if (
                ((this.el = _S.createElement(f7, e11)),
                (P.currentNode = this.el.content),
                2 === i12 || 3 === i12)
            ) {
                const t8 = this.el.content.firstChild
                t8.replaceWith(...t8.childNodes)
            }
            for (; null !== (r8 = P.nextNode()) && d7.length < u6; ) {
                if (1 === r8.nodeType) {
                    if (r8.hasAttributes())
                        for (const t8 of r8.getAttributeNames())
                            if (t8.endsWith(h2)) {
                                const i13 = v3[a6++],
                                    s11 = r8.getAttribute(t8).split(o3),
                                    e12 = /([.?@])?(.*)/.exec(i13)
                                ;(d7.push({
                                    type: 1,
                                    index: l5,
                                    name: e12[2],
                                    strings: s11,
                                    ctor:
                                        "." === e12[1]
                                            ? I
                                            : "?" === e12[1]
                                              ? L
                                              : "@" === e12[1]
                                                ? z
                                                : H,
                                }),
                                    r8.removeAttribute(t8))
                            } else
                                t8.startsWith(o3) &&
                                    (d7.push({ type: 6, index: l5 }),
                                    r8.removeAttribute(t8))
                    if (y2.test(r8.tagName)) {
                        const t8 = r8.textContent.split(o3),
                            i13 = t8.length - 1
                        if (i13 > 0) {
                            r8.textContent = s2 ? s2.emptyScript : ""
                            for (let s11 = 0; s11 < i13; s11++)
                                (r8.append(t8[s11], c3()),
                                    P.nextNode(),
                                    d7.push({ type: 2, index: ++l5 }))
                            r8.append(t8[i13], c3())
                        }
                    }
                } else if (8 === r8.nodeType)
                    if (r8.data === n3) d7.push({ type: 2, index: l5 })
                    else {
                        let t8 = -1
                        for (; -1 !== (t8 = r8.data.indexOf(o3, t8 + 1)); )
                            (d7.push({ type: 7, index: l5 }),
                                (t8 += o3.length - 1))
                    }
                l5++
            }
        }
        static createElement(t7, i12) {
            const s11 = l2.createElement("template")
            return ((s11.innerHTML = t7), s11)
        }
    }
    function M(t7, i12, s11 = t7, e11) {
        if (i12 === E) return i12
        let h8 = void 0 !== e11 ? s11.wi?.[e11] : s11.xi
        const o14 = a2(i12) ? void 0 : i12.md
        return (
            h8?.constructor !== o14 &&
                (h8?.hf?.(false),
                void 0 === o14
                    ? (h8 = void 0)
                    : ((h8 = new o14(t7)), h8.nd(t7, s11, e11)),
                void 0 !== e11 ? ((s11.wi ??= [])[e11] = h8) : (s11.xi = h8)),
            void 0 !== h8 && (i12 = M(t7, h8.yi(t7, i12.values), h8, e11)),
            i12
        )
    }
    var R = class {
        constructor(t7, i12) {
            ;((this.jf = []),
                (this.ja = void 0),
                (this.kf = t7),
                (this.n = i12))
        }
        get parentNode() {
            return this.n.parentNode
        }
        get W() {
            return this.n.W
        }
        u(t7) {
            const {
                    el: { content: i12 },
                    parts: s11,
                } = this.kf,
                e11 = (t7?.creationScope ?? l2).importNode(i12, true)
            P.currentNode = e11
            let h8 = P.nextNode(),
                o14 = 0,
                n10 = 0,
                r8 = s11[0]
            for (; void 0 !== r8; ) {
                if (o14 === r8.index) {
                    let i13
                    ;(2 === r8.type
                        ? (i13 = new k(h8, h8.nextSibling, this, t7))
                        : 1 === r8.type
                          ? (i13 = new r8.ctor(
                                h8,
                                r8.name,
                                r8.strings,
                                this,
                                t7
                            ))
                          : 6 === r8.type && (i13 = new Z(h8, this, t7)),
                        this.jf.push(i13),
                        (r8 = s11[++n10]))
                }
                o14 !== r8?.index && ((h8 = P.nextNode()), o14++)
            }
            return ((P.currentNode = l2), e11)
        }
        p(t7) {
            let i12 = 0
            for (const s11 of this.jf)
                (void 0 !== s11 &&
                    (void 0 !== s11.strings
                        ? (s11.ka(t7, s11, i12),
                          (i12 += s11.strings.length - 2))
                        : s11.ka(t7[i12])),
                    i12++)
        }
    }
    var k = class _k {
        get W() {
            return this.n?.W ?? this.lf
        }
        constructor(t7, i12, s11, e11) {
            ;((this.type = 2),
                (this.c = A),
                (this.ja = void 0),
                (this.pa = t7),
                (this.Za = i12),
                (this.n = s11),
                (this.options = e11),
                (this.lf = e11?.isConnected ?? true))
        }
        get parentNode() {
            let t7 = this.pa.parentNode
            const i12 = this.n
            return (
                void 0 !== i12 && 11 === t7?.nodeType && (t7 = i12.parentNode),
                t7
            )
        }
        get startNode() {
            return this.pa
        }
        get endNode() {
            return this.Za
        }
        ka(t7, i12 = this) {
            ;((t7 = M(this, t7, i12)),
                a2(t7)
                    ? t7 === A || null == t7 || "" === t7
                        ? (this.c !== A && this._a(), (this.c = A))
                        : t7 !== this.c && t7 !== E && this.mf(t7)
                    : void 0 !== t7.va
                      ? this.$(t7)
                      : void 0 !== t7.nodeType
                        ? this.T(t7)
                        : d2(t7)
                          ? this.k(t7)
                          : this.mf(t7))
        }
        O(t7) {
            return this.pa.parentNode.insertBefore(t7, this.Za)
        }
        T(t7) {
            this.c !== t7 && (this._a(), (this.c = this.O(t7)))
        }
        mf(t7) {
            ;(this.c !== A && a2(this.c)
                ? (this.pa.nextSibling.data = t7)
                : this.T(l2.createTextNode(t7)),
                (this.c = t7))
        }
        $(t7) {
            const { values: i12, va: s11 } = t7,
                e11 =
                    "number" == typeof s11
                        ? this.zi(t7)
                        : (void 0 === s11.el &&
                              (s11.el = S2.createElement(
                                  V(s11.h, s11.h[0]),
                                  this.options
                              )),
                          s11)
            if (this.c?.kf === e11) this.c.p(i12)
            else {
                const t8 = new R(e11, this),
                    s12 = t8.u(this.options)
                ;(t8.p(i12), this.T(s12), (this.c = t8))
            }
        }
        zi(t7) {
            let i12 = C.get(t7.strings)
            return (
                void 0 === i12 && C.set(t7.strings, (i12 = new S2(t7))),
                i12
            )
        }
        k(t7) {
            u2(this.c) || ((this.c = []), this._a())
            const i12 = this.c
            let s11,
                e11 = 0
            for (const h8 of t7)
                (e11 === i12.length
                    ? i12.push(
                          (s11 = new _k(
                              this.O(c3()),
                              this.O(c3()),
                              this,
                              this.options
                          ))
                      )
                    : (s11 = i12[e11]),
                    s11.ka(h8),
                    e11++)
            e11 < i12.length &&
                (this._a(s11 && s11.Za.nextSibling, e11), (i12.length = e11))
        }
        _a(t7 = this.pa.nextSibling, s11) {
            for (this.bc?.(false, true, s11); t7 !== this.Za; ) {
                const s12 = i3(t7).nextSibling
                ;(i3(t7).remove(), (t7 = s12))
            }
        }
        setConnected(t7) {
            void 0 === this.n && ((this.lf = t7), this.bc?.(t7))
        }
    }
    var H = class {
        get tagName() {
            return this.element.tagName
        }
        get W() {
            return this.n.W
        }
        constructor(t7, i12, s11, e11, h8) {
            ;((this.type = 1),
                (this.c = A),
                (this.ja = void 0),
                (this.element = t7),
                (this.name = i12),
                (this.n = e11),
                (this.options = h8),
                s11.length > 2 || "" !== s11[0] || "" !== s11[1]
                    ? ((this.c = Array(s11.length - 1).fill(new String())),
                      (this.strings = s11))
                    : (this.c = A))
        }
        ka(t7, i12 = this, s11, e11) {
            const h8 = this.strings
            let o14 = false
            if (void 0 === h8)
                ((t7 = M(this, t7, i12, 0)),
                    (o14 = !a2(t7) || (t7 !== this.c && t7 !== E)),
                    o14 && (this.c = t7))
            else {
                const e12 = t7
                let n10, r8
                for (t7 = h8[0], n10 = 0; n10 < h8.length - 1; n10++)
                    ((r8 = M(this, e12[s11 + n10], i12, n10)),
                        r8 === E && (r8 = this.c[n10]),
                        (o14 ||= !a2(r8) || r8 !== this.c[n10]),
                        r8 === A
                            ? (t7 = A)
                            : t7 !== A && (t7 += (r8 ?? "") + h8[n10 + 1]),
                        (this.c[n10] = r8))
            }
            o14 && !e11 && this.j(t7)
        }
        j(t7) {
            t7 === A
                ? this.element.removeAttribute(this.name)
                : this.element.setAttribute(this.name, t7 ?? "")
        }
    }
    var I = class extends H {
        constructor() {
            ;(super(...arguments), (this.type = 3))
        }
        j(t7) {
            this.element[this.name] = t7 === A ? void 0 : t7
        }
    }
    var L = class extends H {
        constructor() {
            ;(super(...arguments), (this.type = 4))
        }
        j(t7) {
            this.element.toggleAttribute(this.name, !!t7 && t7 !== A)
        }
    }
    var z = class extends H {
        constructor(t7, i12, s11, e11, h8) {
            ;(super(t7, i12, s11, e11, h8), (this.type = 5))
        }
        ka(t7, i12 = this) {
            if ((t7 = M(this, t7, i12, 0) ?? A) === E) return
            const s11 = this.c,
                e11 =
                    (t7 === A && s11 !== A) ||
                    t7.capture !== s11.capture ||
                    t7.once !== s11.once ||
                    t7.passive !== s11.passive,
                h8 = t7 !== A && (s11 === A || e11)
            ;(e11 && this.element.removeEventListener(this.name, this, s11),
                h8 && this.element.addEventListener(this.name, this, t7),
                (this.c = t7))
        }
        handleEvent(t7) {
            "function" == typeof this.c
                ? this.c.call(this.options?.host ?? this.element, t7)
                : this.c.handleEvent(t7)
        }
    }
    var Z = class {
        constructor(t7, i12, s11) {
            ;((this.element = t7),
                (this.type = 6),
                (this.ja = void 0),
                (this.n = i12),
                (this.options = s11))
        }
        get W() {
            return this.n.W
        }
        ka(t7) {
            M(this, t7)
        }
    }
    var j = { I: k }
    var B = t2.litHtmlPolyfillSupport
    ;(B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.2"))
    var D = (t7, i12, s11) => {
        const e11 = s11?.renderBefore ?? i12
        let h8 = e11.Ai
        if (void 0 === h8) {
            const t8 = s11?.renderBefore ?? null
            e11.Ai = h8 = new k(
                i12.insertBefore(c3(), t8),
                t8,
                void 0,
                s11 ?? {}
            )
        }
        return (h8.ka(t7), h8)
    }

    // node_modules/lit-element/lit-element.js
    var s3 = globalThis
    var i4 = class extends y {
        constructor() {
            ;(super(...arguments),
                (this.renderOptions = { host: this }),
                (this.od = void 0))
        }
        createRenderRoot() {
            const t7 = super.createRenderRoot()
            return ((this.renderOptions.renderBefore ??= t7.firstChild), t7)
        }
        update(t7) {
            const r8 = this.render()
            ;(this.hasUpdated ||
                (this.renderOptions.isConnected = this.isConnected),
                super.update(t7),
                (this.od = D(r8, this.renderRoot, this.renderOptions)))
        }
        connectedCallback() {
            ;(super.connectedCallback(), this.od?.setConnected(true))
        }
        disconnectedCallback() {
            ;(super.disconnectedCallback(), this.od?.setConnected(false))
        }
        render() {
            return E
        }
    }
    ;((i4.Kl = true),
        (i4["finalized"] = true),
        s3.litElementHydrateSupport?.({ LitElement: i4 }))
    var o4 = s3.litElementPolyfillSupport
    o4?.({ LitElement: i4 })
    ;(s3.litElementVersions ??= []).push("4.2.2")

    // src/lit/parseCssPropertyValue.ts
    var SINGLE_QUOTE = "'"
    var DOUBLE_QUOTE = '"'
    var ESCAPED_PATTERN = /\\([0-9a-fA-F]{1,6} ?)/g
    function hasLeadingTrailingQuotes(str) {
        if (str.length < 2) return false
        return (
            (str[0] === DOUBLE_QUOTE || str[0] === SINGLE_QUOTE) &&
            (str[str.length - 1] === DOUBLE_QUOTE ||
                str[str.length - 1] === SINGLE_QUOTE)
        )
    }
    function trimQuotes(str) {
        let result = str
        if (result[0] === DOUBLE_QUOTE || result[0] === SINGLE_QUOTE) {
            result = result.slice(1)
        }
        if (
            result[result.length - 1] === DOUBLE_QUOTE ||
            result[result.length - 1] === SINGLE_QUOTE
        ) {
            result = result.slice(0, -1)
        }
        return result
    }
    function escapeQuotes(str) {
        let result = ""
        let prev = ""
        for (let i12 = 0; i12 < str.length; i12++) {
            const next = str[i12 + 1]
            if (str[i12] === "\\" && next === '"') {
                result += '\\"'
                i12++
            } else if (str[i12] === '"' && prev !== "\\") {
                result += '\\"'
            } else {
                result += str[i12]
            }
            prev = str[i12] ?? ""
        }
        return result
    }
    function parseCssPropertyValue(input) {
        let output = input
        if (hasLeadingTrailingQuotes(input)) {
            output = trimQuotes(output)
            output = output.replace(ESCAPED_PATTERN, (_match, group2) => {
                return String.fromCodePoint(parseInt(group2.trim(), 16))
            })
            output = output.replaceAll("\\\n", "\\n")
            output = escapeQuotes(output)
            output = DOUBLE_QUOTE + output + DOUBLE_QUOTE
        }
        try {
            return JSON.parse(output)
        } catch (_error) {
            return void 0
        }
    }

    // src/lit/CssDataMixin.ts
    function CssDataMixin(ctor) {
        class CssDataMixinClass extends ctor {
            constructor() {
                super(...arguments)
                this.nf = null
                this.pd = null
            }
            getCssData(propName, silentCheck = false) {
                const cssDataCache =
                    this.nf ?? /* @__PURE__ */ Object.create(null)
                if (
                    !Object.keys(cssDataCache).includes(propName) ||
                    !cssDataCache[propName]
                ) {
                    if (!this.pd) {
                        this.pd = window.getComputedStyle(this)
                    }
                    const val = this.pd.getPropertyValue(propName).trim()
                    try {
                        cssDataCache[propName] = parseCssPropertyValue(val)
                    } catch (error) {
                        if (!silentCheck) {
                            console.warn(`CSS Data error: ${propName}`, error)
                        }
                        cssDataCache[propName] = null
                    }
                }
                this.nf = cssDataCache
                return cssDataCache[propName]
            }
        }
        return CssDataMixinClass
    }

    // src/lit/LightDomMixin.ts
    function LightDomMixin(ctor) {
        class LightDomMixinClass extends ctor {
            constructor() {
                super(...arguments)
                // Set this to true to adopt children before the first update when multiple slots are expected.
                this.willYield = true
                this.Ia = {}
                this.Ja = null
                this.cc = false
            }
            createRenderRoot() {
                return this
            }
            connectedCallback() {
                if (!this.Ja) {
                    this.Ja = Array.from(this.childNodes)
                }
                super.connectedCallback()
            }
            Bi() {
                if (this.cc) {
                    return
                }
                this.cc = true
                this.Ia = {}
                const directChildren = Array.from(this.childNodes)
                const nodesToProcess = directChildren.length
                    ? directChildren
                    : (this.Ja ?? [])
                for (const child of nodesToProcess) {
                    const slotName = this.of(child)
                    const slotContent = this.Ia[slotName] ?? []
                    if (child instanceof Element) {
                        child.removeAttribute("slot")
                        child.removeAttribute("content-for")
                    }
                    slotContent.push(child)
                    this.Ia[slotName] = slotContent
                }
                this.Ja = null
            }
            of(child) {
                if (
                    child instanceof Comment &&
                    child.nextSibling instanceof Element
                ) {
                    return this.of(child.nextSibling)
                }
                if ("contentFor" in child) {
                    return child.contentFor || ""
                }
                if (
                    child instanceof Element &&
                    child.hasAttribute("content-for")
                ) {
                    return child.getAttribute("content-for") || ""
                }
                return ""
            }
            Ci(node) {
                return !node.textContent || !node.textContent.trim()
            }
            // I'm not sure what the behavior here should be. If there is an expression
            // but it evaluates to nothing being rendered is the slot empty or not? I'm
            // inclined to think that it is not empty; however, I'm not sure how to deal
            // with the fact that lit-html inserts a bunch of empty text placeholder
            // nodes.
            Di(slot) {
                const content = this.Ia[slot]
                return (
                    !content ||
                    content.every((child) => {
                        return (
                            child instanceof Comment ||
                            (child instanceof Text && this.Ci(child))
                        )
                    })
                )
            }
            // Adopting children needs to happen here, opposed to connectedCallback,
            // otherwise AngularJS template expressions will not work. You may think that
            // beating all frameworks to the childNodes would be the answer but Angular,
            // for example, will pre-compile the templates. So it is impossible to beat
            // Angular to the childNodes.
            update(changedProperties) {
                if (!this.hasUpdated && this.willYield) {
                    this.Bi()
                }
                super.update(changedProperties)
            }
            yield(slot, defaultContent) {
                if (
                    slot === "" &&
                    !this.Ia[slot] &&
                    !this.cc &&
                    this.Ja?.length
                ) {
                    const slotContent2 = []
                    for (const child of this.Ja) {
                        if (child instanceof Element) {
                            child.removeAttribute("slot")
                            child.removeAttribute("content-for")
                        }
                        slotContent2.push(child)
                    }
                    this.Ia[slot] = slotContent2
                    this.cc = true
                    this.Ja = null
                }
                const slotContent = this.Ia[slot]
                return b2`
      ${slotContent}
      ${this.Di(slot) ? defaultContent : void 0}
    `
            }
        }
        return LightDomMixinClass
    }

    // src/lit/RegisterableElementMixin.ts
    function RegisterableElementMixin(ctor) {
        class RegisterableElementMixinClass extends ctor {
            static reg(tagName) {
                const currentCtor = this
                const registeredClass = window.customElements.get(tagName)
                if (registeredClass) {
                    if (registeredClass !== currentCtor) {
                        console.warn(
                            [
                                `Element with tag name "${tagName}" already registered.`,
                                `You're trying to override it with another class "${this.name}".`,
                                `This is most likely a mistake.`,
                                `New element will not be registered.`,
                            ].join("\n")
                        )
                    }
                    return
                }
                window.customElements.define(tagName, currentCtor)
            }
        }
        return RegisterableElementMixinClass
    }

    // node_modules/@lit/context/lib/context-request-event.js
    var s4 = class extends Event {
        constructor(s11, t7, e11, o14) {
            ;(super("context-request", { bubbles: true, composed: true }),
                (this.context = s11),
                (this.contextTarget = t7),
                (this.callback = e11),
                (this.subscribe = o14 ?? false))
        }
    }

    // node_modules/@lit/context/lib/create-context.js
    function n4(n10) {
        return n10
    }

    // node_modules/@lit/context/lib/controllers/context-consumer.js
    var s5 = class {
        constructor(t7, s11, i12, h8) {
            if (
                ((this.subscribe = false),
                (this.provided = false),
                (this.value = void 0),
                (this.t = (t8, s12) => {
                    ;(this.unsubscribe &&
                        (this.unsubscribe !== s12 &&
                            ((this.provided = false), this.unsubscribe()),
                        this.subscribe || this.unsubscribe()),
                        (this.value = t8),
                        this.host.requestUpdate(),
                        (this.provided && !this.subscribe) ||
                            ((this.provided = true),
                            this.callback && this.callback(t8, s12)),
                        (this.unsubscribe = s12))
                }),
                (this.host = t7),
                void 0 !== s11.context)
            ) {
                const t8 = s11
                ;((this.context = t8.context),
                    (this.callback = t8.callback),
                    (this.subscribe = t8.subscribe ?? false))
            } else
                ((this.context = s11),
                    (this.callback = i12),
                    (this.subscribe = h8 ?? false))
            this.host.addController(this)
        }
        hostConnected() {
            this.dispatchRequest()
        }
        hostDisconnected() {
            this.unsubscribe &&
                (this.unsubscribe(), (this.unsubscribe = void 0))
        }
        dispatchRequest() {
            this.host.dispatchEvent(
                new s4(this.context, this.host, this.t, this.subscribe)
            )
        }
    }

    // node_modules/@lit/context/lib/value-notifier.js
    var s6 = class {
        get value() {
            return this.o
        }
        set value(s11) {
            this.setValue(s11)
        }
        setValue(s11, t7 = false) {
            const i12 = t7 || !Object.is(s11, this.o)
            ;((this.o = s11), i12 && this.updateObservers())
        }
        constructor(s11) {
            ;((this.subscriptions = /* @__PURE__ */ new Map()),
                (this.updateObservers = () => {
                    for (const [s12, { disposer: t7 }] of this.subscriptions)
                        s12(this.o, t7)
                }),
                void 0 !== s11 && (this.value = s11))
        }
        addCallback(s11, t7, i12) {
            if (!i12) return void s11(this.value)
            this.subscriptions.has(s11) ||
                this.subscriptions.set(s11, {
                    disposer: () => {
                        this.subscriptions.delete(s11)
                    },
                    consumerHost: t7,
                })
            const { disposer: h8 } = this.subscriptions.get(s11)
            s11(this.value, h8)
        }
        clearCallbacks() {
            this.subscriptions.clear()
        }
    }

    // node_modules/@lit/context/lib/controllers/context-provider.js
    var e4 = class extends Event {
        constructor(t7, s11) {
            ;(super("context-provider", { bubbles: true, composed: true }),
                (this.context = t7),
                (this.contextTarget = s11))
        }
    }
    var i5 = class extends s6 {
        constructor(s11, e11, i12) {
            ;(super(void 0 !== e11.context ? e11.initialValue : i12),
                (this.onContextRequest = (t7) => {
                    if (t7.context !== this.context) return
                    const s12 = t7.contextTarget ?? t7.composedPath()[0]
                    s12 !== this.host &&
                        (t7.stopPropagation(),
                        this.addCallback(t7.callback, s12, t7.subscribe))
                }),
                (this.onProviderRequest = (s12) => {
                    if (s12.context !== this.context) return
                    if (
                        (s12.contextTarget ?? s12.composedPath()[0]) ===
                        this.host
                    )
                        return
                    const e12 = /* @__PURE__ */ new Set()
                    for (const [s13, { consumerHost: i13 }] of this
                        .subscriptions)
                        e12.has(s13) ||
                            (e12.add(s13),
                            i13.dispatchEvent(
                                new s4(this.context, i13, s13, true)
                            ))
                    s12.stopPropagation()
                }),
                (this.host = s11),
                void 0 !== e11.context
                    ? (this.context = e11.context)
                    : (this.context = e11),
                this.attachListeners(),
                this.host.addController?.(this))
        }
        attachListeners() {
            ;(this.host.addEventListener(
                "context-request",
                this.onContextRequest
            ),
                this.host.addEventListener(
                    "context-provider",
                    this.onProviderRequest
                ))
        }
        hostConnected() {
            this.host.dispatchEvent(new e4(this.context, this.host))
        }
    }

    // node_modules/@lit/reactive-element/decorators/property.js
    var o5 = {
        attribute: true,
        type: String,
        converter: u,
        reflect: false,
        hasChanged: f,
    }
    var r4 = (t7 = o5, e11, r8) => {
        const { kind: n10, metadata: i12 } = r8
        let s11 = globalThis.litPropertyMetadata.get(i12)
        if (
            (void 0 === s11 &&
                globalThis.litPropertyMetadata.set(
                    i12,
                    (s11 = /* @__PURE__ */ new Map())
                ),
            "setter" === n10 && ((t7 = Object.create(t7)).wrapped = true),
            s11.set(r8.name, t7),
            "accessor" === n10)
        ) {
            const { name: o14 } = r8
            return {
                set(r9) {
                    const n11 = e11.get.call(this)
                    ;(e11.set.call(this, r9),
                        this.requestUpdate(o14, n11, t7, true, r9))
                },
                init(e12) {
                    return (void 0 !== e12 && this.C(o14, void 0, t7, e12), e12)
                },
            }
        }
        if ("setter" === n10) {
            const { name: o14 } = r8
            return function (r9) {
                const n11 = this[o14]
                ;(e11.call(this, r9),
                    this.requestUpdate(o14, n11, t7, true, r9))
            }
        }
        throw Error("Unsupported decorator location: " + n10)
    }
    function n5(t7) {
        return (e11, o14) =>
            "object" == typeof o14
                ? r4(t7, e11, o14)
                : ((t8, e12, o15) => {
                      const r8 = e12.hasOwnProperty(o15)
                      return (
                          e12.constructor.createProperty(o15, t8),
                          r8
                              ? Object.getOwnPropertyDescriptor(e12, o15)
                              : void 0
                      )
                  })(t7, e11, o14)
    }

    // node_modules/@lit/reactive-element/decorators/state.js
    function r5(r8) {
        return n5({ ...r8, state: true, attribute: false })
    }

    // src/utils/debounce.ts
    function debounce(callback, wait) {
        let timer
        const debounced = (...args) => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => callback(...args), wait)
        }
        debounced.cancel = () => {
            if (timer) clearTimeout(timer)
        }
        return debounced
    }

    // src/lit/SymbioteCompatMixin.ts
    var ctxNameContext = n4("ctx-name-context")
    function SymbioteMixin() {
        return function (ctor) {
            class SymbioteMixinClass extends ctor {
                constructor(...args) {
                    super(...args)
                    this.ca = null
                    this.wb = false
                    this.qd = false
                    this.rd = void 0
                    this.$a = /* @__PURE__ */ new Map()
                    this.xb = /* @__PURE__ */ new Set()
                    // Symbiote-style initial values declaration
                    this.init$ = {}
                    this.ctxOwner = false
                    this.dc = void 0
                    this.ec = false
                    this.ctxName = this.wa
                    this.xa = false
                    this.dc = this.getAttribute("ctx-name") || void 0
                    this.ctxName = this.wa
                    this.Ei = new s5(this, {
                        context: ctxNameContext,
                        callback: (value) => {
                            if (!value) {
                                console.error(
                                    "SymbioteMixin: Received invalid ctx-name from context"
                                )
                                return
                            }
                            this.rf = value
                            this.qf()
                        },
                        subscribe: true,
                    })
                }
                static set template(_value) {
                    console.error(
                        `Caution: static 'template' property is deprecated and has no effect. See https://github.com/uploadcare/file-uploader/releases/tag/v1.25.0 for details.`
                    )
                }
                get pf() {
                    return this.dc
                }
                set pf(value) {
                    const normalizedValue = value ?? void 0
                    const oldValue = this.dc
                    if (oldValue === normalizedValue) {
                        return
                    }
                    this.dc = normalizedValue
                    this.qf()
                }
                shouldUpdate(changedProperties) {
                    if (!this.xa) {
                        return false
                    }
                    return super.shouldUpdate(changedProperties)
                }
                get wa() {
                    return this.pf || this.rf || void 0
                }
                qf() {
                    this.ctxName = this.wa
                    if (!this.ctxName || this.wb) {
                        return
                    }
                    if (this.isConnected) {
                        this.sd()
                        return
                    }
                    this.ec = true
                }
                willUpdate(changedProperties) {
                    super.willUpdate(changedProperties)
                    this.ctxName = this.wa
                    if (this.ctxName) {
                        if (!this.rd) {
                            this.rd = new i5(this, {
                                context: ctxNameContext,
                                initialValue: this.ctxName,
                            })
                        } else {
                            this.rd.setValue(this.ctxName)
                        }
                    }
                }
                sf() {
                    if (!this.ca || this.$a.size === 0) {
                        return
                    }
                    for (const [key, { value, rewrite }] of this.$a) {
                        this.ca.add(key, value, rewrite)
                    }
                    this.$a.clear()
                }
                tf() {
                    if (!this.ca && this.wa) {
                        this.td()
                    }
                    if (this.ca) {
                        this.sf()
                    }
                    return this.ca
                }
                fc() {
                    const pubsub = this.tf()
                    if (!pubsub) {
                        throw new Error(
                            "SymbioteMixin: Shared context is not initialized."
                        )
                    }
                    return pubsub
                }
                /**
                 * Initialize shared context after ctxName is available
                 */
                td() {
                    const initialValue = this.init$
                    const ctxName = this.wa
                    if (!ctxName) {
                        console.error(
                            "SymbioteMixin: ctx-name is required for components with shared properties (*)"
                        )
                        return
                    }
                    if (!this.ca) {
                        this.ca =
                            PubSub.getCtx(ctxName) ??
                            PubSub.registerCtx(initialValue, ctxName)
                        for (const [key, defaultValue] of Object.entries(
                            this.init$
                        )) {
                            this.ca.add(key, defaultValue, this.ctxOwner)
                        }
                        this.sf()
                    }
                }
                /**
                 * Proxy for getting/setting values in the shared Symbiote data store.
                 * Keys must start with '*' as local state support has been removed.
                 */
                get $() {
                    if (this.wa) {
                        this.td()
                    }
                    return new Proxy(
                        {},
                        {
                            get: (_target, key) => {
                                if (typeof key !== "string") {
                                    return void 0
                                }
                                return this.ca?.read(key)
                            },
                            set: (_target, key, value) => {
                                if (typeof key !== "string") {
                                    return true
                                }
                                this.ca?.pub(key, value)
                                return true
                            },
                        }
                    )
                }
                sub(key, callback, init = true) {
                    const subscription = this.fc().sub(key, callback, init)
                    if (!subscription || typeof subscription !== "function") {
                        return () => {}
                    }
                    const removeFn = subscription.bind(subscription)
                    let removed = false
                    const trackedRemove = () => {
                        if (removed) {
                            return
                        }
                        removed = true
                        removeFn()
                        this.xb.delete(trackedRemove)
                    }
                    this.xb.add(trackedRemove)
                    return trackedRemove
                }
                pub(key, value) {
                    this.fc().pub(key, value)
                }
                set$(obj) {
                    for (const [prop, value] of Object.entries(obj)) {
                        this.pub(prop, value)
                    }
                }
                get sharedCtx() {
                    return this.fc()
                }
                has(key) {
                    return this.ca?.has(key) ?? false
                }
                add(key, val, rewrite = false) {
                    const pubsub = this.tf()
                    if (!pubsub) {
                        if (!rewrite && this.$a.has(key)) {
                            return
                        }
                        this.$a.set(key, { value: val, rewrite })
                        return
                    }
                    this.$a.delete(key)
                    pubsub.add(key, val, rewrite)
                }
                add$(obj, rewrite = false) {
                    for (const [prop, value] of Object.entries(obj)) {
                        this.add(prop, value, rewrite)
                    }
                }
                connectedCallback() {
                    super.connectedCallback()
                    if (!this.wb) {
                        if (this.ctxName) {
                            this.ec = false
                            this.sd()
                        } else if (this.ec && this.wa) {
                            this.ec = false
                            this.sd()
                        }
                    } else if (this.xa && this.qd) {
                        this.qd = false
                        this.initCallback()
                    }
                }
                /**
                 * Perform component initialization
                 */
                sd() {
                    if (this.wb) return
                    this.wb = true
                    this.td()
                    const sharedSchema = this.init$
                    if (Object.keys(sharedSchema).length > 0) {
                        const pubsub = this.fc()
                        for (const [key, defaultValue] of Object.entries(
                            sharedSchema
                        )) {
                            const existingValue = pubsub.read(key)
                            if (existingValue === void 0) {
                                pubsub.pub(key, defaultValue)
                            }
                            this.sub(
                                key,
                                debounce(async () => {
                                    if (!this.isConnected) return
                                    await this.updateComplete
                                    this.requestUpdate()
                                }, 0),
                                false
                            )
                        }
                    }
                    this.initCallback()
                    this.xa = true
                    this.requestUpdate()
                }
                firstUpdated(changedProperties) {
                    super.firstUpdated(changedProperties)
                }
                disconnectedCallback() {
                    this.Fi()
                    super.disconnectedCallback()
                    if (this.wb) {
                        this.qd = true
                    }
                }
                Fi() {
                    if (this.xb.size === 0) {
                        return
                    }
                    for (const unsubscribe of [...this.xb]) {
                        unsubscribe()
                    }
                    this.xb.clear()
                }
                initCallback() {}
            }
            __decorateClass(
                [n5({ type: String, attribute: "ctx-name", noAccessor: true })],
                SymbioteMixinClass.prototype,
                /* @__KEY__ */ "pf",
                1
            )
            __decorateClass(
                [r5()],
                SymbioteMixinClass.prototype,
                /* @__KEY__ */ "rf",
                2
            )
            __decorateClass([r5()], SymbioteMixinClass.prototype, "ctxName", 2)
            __decorateClass(
                [r5()],
                SymbioteMixinClass.prototype,
                /* @__KEY__ */ "xa",
                2
            )
            return SymbioteMixinClass
        }
    }

    // src/lit/BaseComponent.ts
    var BaseComponent = class extends RegisterableElementMixin(
        SymbioteMixin()(CssDataMixin(LightDomMixin(i4)))
    ) {}

    // src/utils/UID.ts
    var UID = class _UID {
        static generateFastUid() {
            return `uid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
        }
        static generateRandomUUID() {
            const cryptoObj = globalThis.crypto
            if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
                return cryptoObj.randomUUID()
            }
            return _UID.generateFastUid()
        }
    }

    // src/abstract/defineComponents.ts
    var EXCLUDE_COMPONENTS = [
        "UploaderBlock",
        "ActivityBlock",
        "Block",
        "SolutionBlock",
    ]
    function defineComponents(blockExports) {
        for (const blockName in blockExports) {
            if (EXCLUDE_COMPONENTS.includes(blockName)) {
                continue
            }
            let tagName = [...blockName].reduce((name, char) => {
                if (char.toUpperCase() === char) {
                    char = `-${char.toLowerCase()}`
                }
                name += char
                return name
            }, "")
            if (tagName.startsWith("-")) {
                tagName = tagName.replace("-", "")
            }
            if (!tagName.startsWith("uc-")) {
                tagName = `uc-${tagName}`
            }
            if (blockExports[blockName].reg) {
                blockExports[blockName].reg(tagName)
            }
        }
    }

    // src/locales/file-uploader/en.ts
    var en_default = {
        "locale-id": "en",
        "social-source-lang": "en",
        "upload-file": "Upload file",
        "upload-files": "Upload files",
        "choose-file": "Choose file",
        "choose-files": "Choose files",
        "drop-files-here": "Drop files here",
        "drop-file-here": "Drop file here",
        "select-file-source": "Select file source",
        selected: "Selected",
        upload: "Upload",
        "add-more": "Add more",
        cancel: "Cancel",
        "start-from-cancel": "Cancel",
        clear: "Clear",
        "camera-shot": "Shot",
        "upload-url": "Import",
        "upload-url-placeholder": "Paste link here",
        "edit-image": "Edit image",
        "edit-detail": "Details",
        back: "Back",
        done: "Done",
        ok: "Ok",
        "remove-from-list": "Remove",
        no: "No",
        yes: "Yes",
        "confirm-your-action": "Confirm your action",
        "are-you-sure": "Are you sure?",
        "selected-count": "{{count}} of {{total}} selected",
        "select-all": "Select all",
        "deselect-all": "Deselect all",
        "upload-error": "Upload error",
        "validation-error": "Validation error",
        "no-files": "No files selected",
        browse: "Browse",
        "not-uploaded-yet": "Not uploaded yet...",
        file__one: "file",
        file__other: "files",
        error__one: "error",
        error__other: "errors",
        "header-uploading": "Uploading {{count}} {{plural:file(count)}}",
        "header-failed": "{{count}} {{plural:error(count)}}",
        "header-succeed": "{{count}} {{plural:file(count)}} uploaded",
        "header-total": "{{count}} {{plural:file(count)}} selected",
        "src-type-local": "From device",
        "src-type-from-url": "From link",
        "src-type-camera": "Camera",
        "src-type-mobile-video-camera": "Video",
        "src-type-mobile-photo-camera": "Photo",
        "src-type-facebook": "Facebook",
        "src-type-dropbox": "Dropbox",
        "src-type-gdrive": "Google Drive",
        "src-type-ngdrive": "Google Drive",
        "src-type-gphotos": "Google Photos",
        "src-type-flickr": "Flickr",
        "src-type-vk": "VK",
        "src-type-evernote": "Evernote",
        "src-type-box": "Box",
        "src-type-onedrive": "OneDrive",
        "src-type-huddle": "Huddle",
        "src-type-other": "Other",
        "caption-from-url": "Import from link",
        "caption-camera": "Camera",
        "caption-edit-file": "Edit file",
        "file-no-name": "No name...",
        "toggle-fullscreen": "Toggle fullscreen",
        "toggle-guides": "Toggle guides",
        rotate: "Rotate",
        "flip-vertical": "Flip vertical",
        "flip-horizontal": "Flip horizontal",
        apply: "Apply",
        brightness: "Brightness",
        contrast: "Contrast",
        saturation: "Saturation",
        exposure: "Exposure",
        gamma: "Gamma",
        vibrance: "Vibrance",
        warmth: "Warmth",
        enhance: "Enhance",
        original: "Original",
        resize: "Resize image",
        crop: "Crop",
        "select-color": "Select color",
        text: "Text",
        draw: "Draw",
        "cancel-edit": "Cancel edit",
        "tab-view": "Preview",
        "tab-details": "Details",
        "file-name": "Name",
        "file-size": "Size",
        "cdn-url": "CDN URL",
        "file-size-unknown": "Unknown",
        "camera-permissions-denied": "Camera access denied",
        "camera-permissions-prompt": "Please allow access to the camera",
        "camera-permissions-request": "Request access",
        "files-count-limit-error-title": "Files count limit overflow",
        "files-count-limit-error-too-few":
            "You\u2019ve chosen {{total}} {{plural:file(total)}}. At least {{min}} {{plural:file(min)}} required.",
        "files-count-limit-error-too-many":
            "You\u2019ve chosen too many files. {{max}} {{plural:file(max)}} is maximum.",
        "files-max-size-limit-error":
            "File is too big. Max file size is {{maxFileSize}}.",
        "has-validation-errors":
            "File validation error occurred. Please, check your files before upload.",
        "images-only-accepted": "Only image files are accepted.",
        "file-type-not-allowed":
            "Uploading of these file types is not allowed.",
        "some-files-were-not-uploaded": "Some files were not uploaded.",
        "file-item-edit-button": "Edit",
        "file-item-remove-button": "Remove",
        "a11y-editor-tab-filters": "Filters",
        "a11y-editor-tab-tuning": "Tuning",
        "a11y-editor-tab-crop": "Crop",
        "a11y-activity-header-button-close": "Close",
        flip: "Flip",
        mirror: "Mirror",
        "a11y-cloud-editor-apply-filter": "Apply {{name}} filter",
        "a11y-cloud-editor-apply-crop": "Apply {{name}} operation",
        "a11y-cloud-editor-apply-tuning": "Apply {{name}} tuning",
        "a11y-cloud-editor-apply-aspect-ratio":
            "Apply operation {{name}} {{value}}",
        finished: "Finished",
        failed: "Failed",
        uploading: "Uploading",
        idle: "Idle",
        "a11y-file-item-status": "File {{fileName}} in status {{status}}",
        "waiting-for": "Waiting for {{source}}",
        "queued-uploading": "Queued for upload",
        "queued-validation": "Queued for validation",
        validation: "Validating",
        "crop-to-shape": "Crop to {{value}}",
        custom: "Freeform",
        "freeform-crop": "Freeform crop",
        "upload-from": "Upload {{source}}",
        "get-from": "Get from {{source}}",
        "capture-with": "Capture with {{source}}",
        take: "Take {{source}}",
        record: "Record {{source}}",
        retake: "Retake",
        accept: "Accept",
    }

    // src/abstract/localeRegistry.ts
    var localeRegistry = /* @__PURE__ */ new Map()
    var localeResolvers = /* @__PURE__ */ new Map()
    var defineLocaleSync = (localeName, definition) => {
        if (localeRegistry.has(localeName)) {
            console.log(
                `Locale ${localeName} is already defined. Overwriting...`
            )
        }
        const locale = { ...en_default, ...definition }
        localeRegistry.set(localeName, locale)
        return locale
    }
    var defineLocaleAsync = (localeName, definitionResolver) => {
        localeResolvers.set(localeName, definitionResolver)
    }
    var defineLocale = (localeName, definitionOrResolver) => {
        if (typeof definitionOrResolver === "function") {
            defineLocaleAsync(localeName, definitionOrResolver)
        } else {
            defineLocaleSync(localeName, definitionOrResolver)
        }
    }
    var resolveLocaleDefinition = async (localeName) => {
        let localeDefinition = localeRegistry.get(localeName)
        if (!localeDefinition) {
            const definitionResolver = localeResolvers.get(localeName)
            if (!definitionResolver) {
                throw new Error(`Locale ${localeName} is not defined`)
            }
            const definition = await definitionResolver()
            localeDefinition = defineLocaleSync(localeName, definition)
        }
        return localeDefinition
    }
    defineLocale("en", en_default)

    // src/abstract/sharedConfigKey.ts
    var sharedConfigKey = (key) => `*cfg/${key}`

    // src/utils/comma-separated.ts
    var deserializeCsv = (value) => {
        if (!value) {
            return []
        }
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
    }
    var serializeCsv = (value) => {
        return value.join(",")
    }

    // src/utils/cdn-utils.ts
    var normalizeCdnOperation = (operation) => {
        if (typeof operation !== "string" || !operation) {
            return ""
        }
        let str = operation.trim()
        if (str.startsWith("-/")) {
            str = str.slice(2)
        } else if (str.startsWith("/")) {
            str = str.slice(1)
        }
        if (str.endsWith("/")) {
            str = str.slice(0, str.length - 1)
        }
        return str
    }
    var joinCdnOperations = (...operations) => {
        return operations
            .filter((op) => typeof op === "string" && !!op)
            .map((op) => normalizeCdnOperation(op))
            .join("/-/")
    }
    var createCdnUrlModifiers = (...cdnOperations) => {
        const joined = joinCdnOperations(...cdnOperations)
        return joined ? `-/${joined}/` : ""
    }
    function extractFilename(cdnUrl) {
        const url = new URL(cdnUrl)
        const noOrigin = url.pathname + url.search + url.hash
        const urlFilenameIdx = noOrigin.lastIndexOf("http")
        const plainFilenameIdx = noOrigin.lastIndexOf("/")
        let filename = ""
        if (urlFilenameIdx >= 0) {
            filename = noOrigin.slice(urlFilenameIdx)
        } else if (plainFilenameIdx >= 0) {
            filename = noOrigin.slice(plainFilenameIdx + 1)
        }
        return filename
    }
    function extractUuid(cdnUrl) {
        const url = new URL(cdnUrl)
        const { pathname } = url
        const slashIndex = pathname.indexOf("/")
        const secondSlashIndex = pathname.indexOf("/", slashIndex + 1)
        return pathname.substring(slashIndex + 1, secondSlashIndex)
    }
    function extractCdnUrlModifiers(cdnUrl) {
        const withoutFilename = trimFilename(cdnUrl)
        const url = new URL(withoutFilename)
        const operationsMarker = url.pathname.indexOf("/-/")
        if (operationsMarker === -1) {
            return ""
        }
        const operationsStr = url.pathname.substring(operationsMarker).slice(1)
        return operationsStr
    }
    function extractOperations(cdnUrl) {
        const operationsStr = extractCdnUrlModifiers(cdnUrl)
        return operationsStr
            .split("/-/")
            .filter(Boolean)
            .map((operation) => normalizeCdnOperation(operation))
    }
    function trimFilename(cdnUrl) {
        const url = new URL(cdnUrl)
        const filename = extractFilename(cdnUrl)
        const filenamePathPart = isFileUrl(filename)
            ? splitFileUrl(filename).pathname
            : filename
        url.pathname = url.pathname.replace(filenamePathPart, "")
        url.search = ""
        url.hash = ""
        return url.toString()
    }
    function isFileUrl(filename) {
        return filename.startsWith("http")
    }
    function splitFileUrl(fileUrl) {
        const url = new URL(fileUrl)
        return {
            pathname: `${url.origin}${url.pathname ?? ""}`,
            search: url.search ?? "",
            hash: url.hash ?? "",
        }
    }
    var createCdnUrl = (baseCdnUrl, cdnModifiers, filename) => {
        const url = new URL(trimFilename(baseCdnUrl))
        const resolvedFilename = filename ?? extractFilename(baseCdnUrl)
        const resolvedModifiers = cdnModifiers ?? ""
        if (url.pathname.startsWith("//")) {
            url.pathname = url.pathname.replace("//", "/")
        }
        if (resolvedFilename && isFileUrl(resolvedFilename)) {
            const splitted = splitFileUrl(resolvedFilename)
            url.pathname = `${url.pathname}${resolvedModifiers}${splitted.pathname || ""}`
            url.search = splitted.search
            url.hash = splitted.hash
        } else {
            url.pathname = `${url.pathname}${resolvedModifiers}${resolvedFilename || ""}`
        }
        return url.toString()
    }
    var createOriginalUrl = (cdnUrl, uuid) => {
        const url = new URL(cdnUrl)
        url.pathname = `${uuid}/`
        return url.toString()
    }

    // src/utils/stringToArray.ts
    var stringToArray = (str, delimiter = ",") => {
        return str
            .trim()
            .split(delimiter)
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
    }

    // src/blocks/CloudImageEditor/src/lib/transformationUtils.ts
    var OPERATIONS_DEFAULTS = Object.freeze({
        brightness: 0,
        exposure: 0,
        gamma: 100,
        contrast: 0,
        saturation: 0,
        vibrance: 0,
        warmth: 0,
        enhance: 0,
        filter: 0,
        rotate: 0,
        mirror: false,
        flip: false,
        crop: void 0,
    })
    var SUPPORTED_OPERATIONS_ORDERED = [
        "enhance",
        "brightness",
        "exposure",
        "gamma",
        "contrast",
        "saturation",
        "vibrance",
        "warmth",
        "filter",
        "mirror",
        "flip",
        "rotate",
        "crop",
    ]
    function transformationToStr(operation, options) {
        if (typeof options === "number") {
            const value = options
            return OPERATIONS_DEFAULTS[operation] !== value
                ? `${operation}/${value}`
                : ""
        }
        if (typeof options === "boolean") {
            const value = options
            return OPERATIONS_DEFAULTS[operation] !== value
                ? `${operation}`
                : ""
        }
        if (operation === "filter" && options) {
            const { name, amount } = options
            if (OPERATIONS_DEFAULTS.filter === amount) {
                return ""
            }
            return `${operation}/${name}/${amount}`
        }
        if (operation === "crop" && options) {
            const { dimensions, coords } = options
            return `${operation}/${dimensions.join("x")}/${coords.join(",")}`
        }
        return ""
    }
    function transformationsToOperations(transformations) {
        return joinCdnOperations(
            ...SUPPORTED_OPERATIONS_ORDERED.filter(
                (operation) =>
                    typeof transformations[operation] !== "undefined" &&
                    transformations[operation] !== null
            )
                .map((operation) => {
                    const options = transformations[operation]
                    return transformationToStr(operation, options)
                })
                .filter((str) => !!str)
        )
    }
    var COMMON_OPERATIONS = joinCdnOperations("format/auto", "progressive/yes")
    var asNumber = ([value]) =>
        typeof value !== "undefined" ? Number(value) : void 0
    var asBoolean = () => true
    var asFilter = ([name, amount]) => ({
        name,
        amount: typeof amount !== "undefined" ? Number(amount) : 100,
    })
    var asCrop = ([dimensions, alignment]) => {
        if (!/\d+x\d+/.test(dimensions) || !/\d+,\d+/.test(alignment)) {
            throw new Error(
                "Crop by aspect ratio, percentage or alignment shortcuts is not supported."
            )
        }
        return {
            dimensions: stringToArray(dimensions, "x").map(Number),
            coords: stringToArray(alignment).map(Number),
        }
    }
    var OPERATION_PROCESSORS = Object.freeze({
        enhance: asNumber,
        brightness: asNumber,
        exposure: asNumber,
        gamma: asNumber,
        contrast: asNumber,
        saturation: asNumber,
        vibrance: asNumber,
        warmth: asNumber,
        filter: asFilter,
        mirror: asBoolean,
        flip: asBoolean,
        rotate: asNumber,
        crop: (args) => {
            const [dimensions, alignment] = args
            const { dimensions: parsedDimensions, coords } = asCrop([
                dimensions,
                alignment,
            ])
            return {
                dimensions: parsedDimensions,
                coords,
            }
        },
    })
    function operationsToTransformations(operations) {
        const transformations = {}
        for (const operation of operations) {
            const [name, ...args] = operation.split("/")
            if (!name || !SUPPORTED_OPERATIONS_ORDERED.includes(name)) {
                continue
            }
            const operationName = name
            const processor = OPERATION_PROCESSORS[operationName]
            try {
                const value = processor(args)
                transformations[operationName] = value
            } catch (err) {
                console.warn(
                    [
                        `Failed to parse URL operation "${operation}". It will be ignored.`,
                        err instanceof Error
                            ? `Error message: "${err.message}"`
                            : err,
                        "If you need this functionality, please feel free to open an issue at https://github.com/uploadcare/blocks/issues/new",
                    ].join("\n")
                )
            }
        }
        return transformations
    }

    // src/blocks/CloudImageEditor/src/toolbar-constants.ts
    var TabId = Object.freeze({
        CROP: "crop",
        TUNING: "tuning",
        FILTERS: "filters",
    })
    var ALL_TABS = Object.freeze([TabId.CROP, TabId.TUNING, TabId.FILTERS])
    var ALL_COLOR_OPERATIONS = Object.freeze([
        "brightness",
        "exposure",
        "gamma",
        "contrast",
        "saturation",
        "vibrance",
        "warmth",
        "enhance",
    ])
    var ALL_FILTERS = Object.freeze([
        "adaris",
        "briaril",
        "calarel",
        "carris",
        "cynarel",
        "cyren",
        "elmet",
        "elonni",
        "enzana",
        "erydark",
        "fenralan",
        "ferand",
        "galen",
        "gavin",
        "gethriel",
        "iorill",
        "iothari",
        "iselva",
        "jadis",
        "lavra",
        "misiara",
        "namala",
        "nerion",
        "nethari",
        "pamaya",
        "sarnar",
        "sedis",
        "sewen",
        "sorahel",
        "sorlen",
        "tarian",
        "thellassan",
        "varriel",
        "varven",
        "vevera",
        "virkas",
        "yedis",
        "yllara",
        "zatvel",
        "zevcen",
    ])
    var ALL_CROP_OPERATIONS = Object.freeze(["rotate", "mirror", "flip"])
    var NUMERIC_OPERATION_DEFAULTS = OPERATIONS_DEFAULTS
    var COLOR_OPERATIONS_CONFIG = Object.freeze({
        brightness: {
            zero: NUMERIC_OPERATION_DEFAULTS.brightness,
            range: [-100, 100],
            keypointsNumber: 2,
        },
        exposure: {
            zero: NUMERIC_OPERATION_DEFAULTS.exposure,
            range: [-500, 500],
            keypointsNumber: 2,
        },
        gamma: {
            zero: NUMERIC_OPERATION_DEFAULTS.gamma,
            range: [0, 1e3],
            keypointsNumber: 2,
        },
        contrast: {
            zero: NUMERIC_OPERATION_DEFAULTS.contrast,
            range: [-100, 500],
            keypointsNumber: 2,
        },
        saturation: {
            zero: NUMERIC_OPERATION_DEFAULTS.saturation,
            range: [-100, 500],
            keypointsNumber: 1,
        },
        vibrance: {
            zero: NUMERIC_OPERATION_DEFAULTS.vibrance,
            range: [-100, 500],
            keypointsNumber: 1,
        },
        warmth: {
            zero: NUMERIC_OPERATION_DEFAULTS.warmth,
            range: [-100, 100],
            keypointsNumber: 1,
        },
        enhance: {
            zero: NUMERIC_OPERATION_DEFAULTS.enhance,
            range: [0, 100],
            keypointsNumber: 1,
        },
        filter: {
            zero: NUMERIC_OPERATION_DEFAULTS.filter,
            range: [0, 100],
            keypointsNumber: 1,
        },
    })

    // src/blocks/Config/initialConfig.ts
    var DEFAULT_CDN_CNAME = "https://ucarecdn.com"
    var DEFAULT_BASE_URL = "https://upload.uploadcare.com"
    var DEFAULT_SOCIAL_BASE_URL = "https://social.uploadcare.com"
    var DEFAULT_PREFIXED_CDN_BASE_DOMAIN = "https://ucarecd.net"
    var config = {
        pubkey: "",
        multiple: true,
        multipleMin: 0,
        multipleMax: Number.MAX_SAFE_INTEGER,
        confirmUpload: false,
        imgOnly: false,
        accept: "",
        externalSourcesPreferredTypes: "",
        externalSourcesEmbedCss: "",
        store: "auto",
        cameraMirror: false,
        cameraCapture: "",
        sourceList: "local",
        topLevelOrigin: "",
        maxLocalFileSizeBytes: 0,
        thumbSize: 76,
        showEmptyList: false,
        useLocalImageEditor: false,
        removeCopyright: false,
        cropPreset: "",
        imageShrink: "",
        modalScrollLock: true,
        modalBackdropStrokes: false,
        sourceListWrap: true,
        remoteTabSessionKey: "",
        cdnCname: DEFAULT_CDN_CNAME,
        cdnCnamePrefixed: DEFAULT_PREFIXED_CDN_BASE_DOMAIN,
        baseUrl: DEFAULT_BASE_URL,
        socialBaseUrl: DEFAULT_SOCIAL_BASE_URL,
        secureSignature: "",
        secureExpire: "",
        secureDeliveryProxy: "",
        retryThrottledRequestMaxTimes: 3,
        retryNetworkErrorMaxTimes: 3,
        multipartMinFileSize: 26214400,
        multipartChunkSize: 5242880,
        maxConcurrentRequests: 10,
        multipartMaxConcurrentRequests: 4,
        multipartMaxAttempts: 3,
        checkForUrlDuplicates: false,
        saveUrlForRecurrentUploads: false,
        groupOutput: false,
        userAgentIntegration: "",
        debug: false,
        metadata: null,
        tags: null,
        localeName: "en",
        localeDefinitionOverride: null,
        secureUploadsExpireThreshold: 10 * 60 * 1e3,
        secureUploadsSignatureResolver: null,
        secureDeliveryProxyUrlResolver: null,
        iconHrefResolver: null,
        fileValidators: [],
        collectionValidators: [],
        validationTimeout: 15 * 1e3,
        validationConcurrency: 100,
        cameraModes: "photo, video",
        defaultCameraMode: null,
        enableAudioRecording: true,
        enableVideoRecording: null,
        maxVideoRecordingDuration: null,
        mediaRecorderOptions: null,
        filesViewMode: "list",
        gridShowFileNames: false,
        // Cloud Image Editor options (used by cloudImageEditorPlugin)
        useCloudImageEditor: true,
        cloudImageEditorAutoOpen: false,
        cloudImageEditorTabs: serializeCsv(ALL_TABS),
        cloudImageEditorMaskHref: null,
        testMode: false,
        qualityInsights: true,
        pasteScope: "local",
        plugins: [],
        dynamicButtonViewMode: "auto",
        dynamicButtonShowFirstIcon: true,
    }
    var initialConfig = Object.freeze(config)

    // src/lit/createDebugPrinter.ts
    var createDebugPrinter = (getCtx, scope) => {
        return (...args) => {
            const ctx = getCtx()
            if (!ctx.read(sharedConfigKey("debug"))) {
                return
            }
            let consoleArgs = args
            if (typeof args?.[0] === "function") {
                const resolver = args[0]
                consoleArgs = resolver()
            }
            const prefixes = [ctx.id, scope].filter(Boolean)
            console.log(`[${prefixes.join("][")}]`, ...consoleArgs)
        }
    }

    // src/lit/shared-instances.ts
    var SharedInstance = class {
        constructor(sharedInstancesBag) {
            this.ud = /* @__PURE__ */ new Set()
            this.Ka = null
            this.v = createDebugPrinter(() => this.a.ctx, this.constructor.name)
            this.a = sharedInstancesBag
            this.b = sharedInstancesBag.ctx
        }
        addSub(unsub) {
            this.ud.add(unsub)
        }
        get La() {
            if (!this.Ka) {
                const proxyTarget = {}
                this.Ka = new Proxy(proxyTarget, {
                    set: () => {
                        throw new Error("SharedInstance cfg proxy is read-only")
                    },
                    get: (_obj, key) => {
                        if (typeof key !== "string") {
                            return
                        }
                        const sharedKey = sharedConfigKey(key)
                        if (!this.a.ctx.has(sharedKey)) {
                            return initialConfig[key]
                        }
                        return this.a.ctx.read(sharedKey)
                    },
                })
            }
            return this.Ka
        }
        destroy() {
            for (const unsub of this.ud) {
                try {
                    unsub()
                } catch {}
            }
            this.ud.clear()
        }
    }
    var instanceKeyMap = {
        modalManager: "*modalManager",
        pluginManager: "*pluginManager",
        telemetryManager: "*telemetryManager",
        localeManager: "*localeManager",
        a11y: "*a11y",
        clipboard: "*clipboard",
        routerLayer: "*routerLayer",
        blocksRegistry: "*blocksRegistry",
        eventEmitter: "*eventEmitter",
        uploadCollection: "*uploadCollection",
        secureUploadsManager: "*secureUploadsManager",
        api: "*publicApi",
        validationManager: "*validationManager",
    }
    var getSharedInstance = (ctx, key, isRequired = true) => {
        const hasKey = ctx.has(key)
        const value = hasKey ? ctx.read(key) : null
        if (hasKey && !!value) {
            return value
        }
        if (!isRequired) {
            return value
        }
        throw new Error(
            `Unexpected error: shared instance for key "${String(key)}" is not available`
        )
    }
    var createSharedInstancesBag = (getCtx) => {
        return {
            get ctx() {
                return getCtx()
            },
            get modalManager() {
                return getSharedInstance(getCtx(), "*modalManager", false)
            },
            get pluginManager() {
                return getSharedInstance(getCtx(), "*pluginManager")
            },
            get telemetryManager() {
                return getSharedInstance(getCtx(), "*telemetryManager")
            },
            get localeManager() {
                return getSharedInstance(getCtx(), "*localeManager")
            },
            get a11y() {
                return getSharedInstance(getCtx(), "*a11y")
            },
            get routerLayer() {
                return getSharedInstance(getCtx(), "*routerLayer")
            },
            get blocksRegistry() {
                return getSharedInstance(getCtx(), "*blocksRegistry")
            },
            get eventEmitter() {
                return getSharedInstance(getCtx(), "*eventEmitter")
            },
            get uploadCollection() {
                return getSharedInstance(getCtx(), "*uploadCollection")
            },
            get secureUploadsManager() {
                return getSharedInstance(
                    getCtx(),
                    "*secureUploadsManager",
                    false
                )
            },
            get api() {
                return getSharedInstance(getCtx(), "*publicApi")
            },
            get validationManager() {
                return getSharedInstance(getCtx(), "*validationManager")
            },
            when(name, callback) {
                const stateKey = instanceKeyMap[name]
                const ctx = getCtx()
                const existingInstance = ctx.has(stateKey)
                    ? ctx.read(stateKey)
                    : void 0
                if (existingInstance) {
                    callback(existingInstance)
                    return () => {}
                }
                let unsub
                unsub = ctx.sub(stateKey, (instance) => {
                    if (instance) {
                        callback(instance)
                        unsub?.()
                    }
                })
                return unsub
            },
            wait(name) {
                return new Promise((resolve) => {
                    let unsub
                    unsub = this.when(name, (instance) => {
                        resolve(instance)
                        unsub?.()
                    })
                })
            },
        }
    }

    // src/abstract/managers/ModalManager.ts
    var ModalEvents = Object.freeze({
        ADD: "modal:add",
        DELETE: "modal:delete",
        OPEN: "modal:open",
        CLOSE: "modal:close",
        CLOSE_ALL: "modal:closeAll",
        DESTROY: "modal:destroy",
    })
    var ModalManager = class extends SharedInstance {
        constructor() {
            super(...arguments)
            this.Ma = /* @__PURE__ */ new Map()
            this.la = /* @__PURE__ */ new Set()
            this.i = /* @__PURE__ */ new Map()
        }
        /**
         * Register a modal with the manager
         * @param id Unique identifier for the modal
         * @param modal Modal component instance
         */
        registerModal(id, modal) {
            this.Ma.set(id, modal)
            this.Q(ModalEvents.ADD, { id, modal })
        }
        /** Remove a modal by ID. */
        deleteModal(id) {
            const modal = this.Ma.get(id)
            if (!modal) return false
            this.Ma.delete(id)
            this.la.delete(id)
            this.Q(ModalEvents.DELETE, { id, modal })
            return true
        }
        /** Open a modal by its ID. */
        open(id) {
            const modal = this.Ma.get(id)
            if (!modal) {
                this.v(`Modal with ID "${id}" not found`)
                return false
            }
            this.la.add(id)
            this.Q(ModalEvents.OPEN, { modal, id })
            return true
        }
        /** Close a specific modal by ID. */
        close(id) {
            const modal = this.Ma.get(id)
            if (!modal || !this.la.has(id)) {
                this.v(`Modal with ID "${id}" not found or not active`)
                return false
            }
            this.la.delete(id)
            this.Q(ModalEvents.CLOSE, { id, modal })
            return true
        }
        /** Toggle a modal - open if closed, close if open. */
        toggle(id) {
            if (!this.Ma.has(id)) {
                this.v(`Modal with ID "${id}" not found`)
                return false
            }
            if (this.la.has(id)) {
                return this.close(id)
            } else {
                return this.open(id)
            }
        }
        /** True if there are any active modals. */
        get hasActiveModals() {
            return this.la.size > 0
        }
        /** Close the most recently opened modal and return to the previous one. */
        back() {
            if (this.la.size === 0) {
                this.v("No active modals to go back from")
                return false
            }
            const lastModalId = Array.from(this.la).pop()
            return lastModalId ? this.close(lastModalId) : false
        }
        /** Close all open modals. */
        closeAll() {
            const count = this.la.size
            this.la.clear()
            this.Q(ModalEvents.CLOSE_ALL, {})
            return count
        }
        /**
         * Subscribe to modal events
         * @returns Unsubscribe function
         */
        subscribe(event, callback) {
            if (!this.i.has(event)) {
                this.i.set(event, /* @__PURE__ */ new Set())
            }
            this.i.get(event)?.add(callback)
            return () => this.unsubscribe(event, callback)
        }
        /** Unsubscribe from modal events */
        unsubscribe(event, callback) {
            if (this.i.has(event)) {
                this.i.get(event)?.delete(callback)
            }
        }
        /** Notify all subscribers of a modal event. */
        Q(event, data) {
            if (this.i.has(event)) {
                for (const callback of this.i.get(event) ??
                    /* @__PURE__ */ new Set()) {
                    try {
                        callback(data)
                    } catch (error) {
                        this.a.telemetryManager.sendEventError(
                            error,
                            "modal subscriber"
                        )
                        this.v("Error in modal subscriber:", error)
                    }
                }
            }
        }
        /** Destroy the modal manager, clean up resources */
        destroy() {
            super.destroy()
            this.closeAll()
            this.Ma.clear()
            this.i.clear()
            this.Q(ModalEvents.DESTROY, {})
        }
    }

    // src/utils/toKebabCase.ts
    var toKebabCase = (str) =>
        str
            .match(
                /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
            )
            ?.map((x2) => x2.toLowerCase())
            .join("-")

    // node_modules/@uploadcare/upload-client/dist/esm/index.browser.mjs
    function isObject(o14) {
        return Object.prototype.toString.call(o14) === "[object Object]"
    }
    var SEPARATOR = /\W|_/g
    function camelizeString(text) {
        return text
            .split(SEPARATOR)
            .map(
                (word, index) =>
                    word
                        .charAt(0)
                        [index > 0 ? "toUpperCase" : "toLowerCase"]() +
                    word.slice(1)
            )
            .join("")
    }
    function camelizeArrayItems(array, { ignoreKeys } = { ignoreKeys: [] }) {
        if (!Array.isArray(array)) {
            return array
        }
        return array.map((item) => camelizeKeys(item, { ignoreKeys }))
    }
    function camelizeKeys(source, { ignoreKeys } = { ignoreKeys: [] }) {
        if (Array.isArray(source)) {
            return camelizeArrayItems(source, { ignoreKeys })
        }
        if (!isObject(source)) {
            return source
        }
        const result = {}
        for (const key of Object.keys(source)) {
            let value = source[key]
            if (ignoreKeys.includes(key)) {
                result[key] = value
                continue
            }
            if (isObject(value)) {
                value = camelizeKeys(value, { ignoreKeys })
            } else if (Array.isArray(value)) {
                value = camelizeArrayItems(value, { ignoreKeys })
            }
            result[camelizeString(key)] = value
        }
        return result
    }
    var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    function getUserAgent$1({
        libraryName,
        libraryVersion,
        userAgent,
        publicKey = "",
        integration = "",
    }) {
        const languageName = "JavaScript"
        if (typeof userAgent === "string") {
            return userAgent
        }
        if (typeof userAgent === "function") {
            return userAgent({
                publicKey,
                libraryName,
                libraryVersion,
                languageName,
                integration,
            })
        }
        const mainInfo = [libraryName, libraryVersion, publicKey]
            .filter(Boolean)
            .join("/")
        const additionInfo = [languageName, integration]
            .filter(Boolean)
            .join("; ")
        return `${mainInfo} (${additionInfo})`
    }
    var defaultOptions = {
        factor: 2,
        time: 100,
    }
    function retrier(fn, options = defaultOptions) {
        let attempts = 0
        function runAttempt(fn2) {
            const defaultDelayTime = Math.round(
                options.time * options.factor ** attempts
            )
            const retry = (ms) =>
                delay(ms ?? defaultDelayTime).then(() => {
                    attempts += 1
                    return runAttempt(fn2)
                })
            return fn2({
                attempt: attempts,
                retry,
            })
        }
        return runAttempt(fn)
    }
    var UploadcareError = class extends Error {}
    var NetworkError = class _NetworkError extends UploadcareError {
        originalProgressEvent
        constructor(progressEvent) {
            super()
            this.name = "NetworkError"
            this.message = "Network error"
            Object.setPrototypeOf(this, _NetworkError.prototype)
            this.originalProgressEvent = progressEvent
        }
    }
    var onCancel = (signal, callback) => {
        if (signal) {
            if (signal.aborted) {
                Promise.resolve().then(callback)
            } else {
                signal.addEventListener("abort", () => callback(), {
                    once: true,
                })
            }
        }
    }
    var CancelError = class _CancelError extends UploadcareError {
        isCancel = true
        constructor(message = "Request canceled") {
            super(message)
            this.name = "CancelError"
            Object.setPrototypeOf(this, _CancelError.prototype)
        }
    }
    var DEFAULT_INTERVAL = 500
    var poll = ({ check, interval = DEFAULT_INTERVAL, timeout, signal }) =>
        new Promise((resolve, reject) => {
            let tickTimeoutId
            let timeoutId
            onCancel(signal, () => {
                tickTimeoutId && clearTimeout(tickTimeoutId)
                reject(new CancelError("Poll cancelled"))
            })
            if (timeout) {
                timeoutId = setTimeout(() => {
                    tickTimeoutId && clearTimeout(tickTimeoutId)
                    reject(new CancelError("Timed out"))
                }, timeout)
            }
            const tick = () => {
                try {
                    Promise.resolve(check(signal))
                        .then((result) => {
                            if (result) {
                                timeoutId && clearTimeout(timeoutId)
                                resolve(result)
                            } else {
                                tickTimeoutId = setTimeout(tick, interval)
                            }
                        })
                        .catch((error) => {
                            timeoutId && clearTimeout(timeoutId)
                            reject(error)
                        })
                } catch (error) {
                    timeoutId && clearTimeout(timeoutId)
                    reject(error)
                }
            }
            tickTimeoutId = setTimeout(tick, 0)
        })
    var defaultSettings = {
        baseCDN: "https://ucarecdn.com",
        prefixedBaseCDN: "https://ucarecd.net",
        baseURL: "https://upload.uploadcare.com",
        // 50 MB
        retryThrottledRequestMaxTimes: 1,
        retryNetworkErrorMaxTimes: 3,
        multipartMinFileSize: 25 * 1024 * 1024,
        // 25 MB
        multipartChunkSize: 5 * 1024 * 1024,
        // 1MB
        maxConcurrentRequests: 4,
        pusherKey: "79ae88bd931ea68464d9",
    }
    var defaultContentType = "application/octet-stream"
    var defaultFilename = "original"
    var request = ({ method, url, data, headers = {}, signal, onProgress }) =>
        new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            const requestMethod = method?.toUpperCase() || "GET"
            let aborted = false
            xhr.open(requestMethod, url, true)
            if (headers) {
                Object.entries(headers).forEach((entry) => {
                    const [key, value] = entry
                    typeof value !== "undefined" &&
                        !Array.isArray(value) &&
                        xhr.setRequestHeader(key, value)
                })
            }
            xhr.responseType = "text"
            onCancel(signal, () => {
                aborted = true
                xhr.abort()
                reject(new CancelError())
            })
            xhr.onload = () => {
                if (xhr.status != 200) {
                    reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`))
                } else {
                    const request2 = {
                        method: requestMethod,
                        url,
                        data,
                        headers: headers || void 0,
                        signal,
                        onProgress,
                    }
                    const headersArray = xhr
                        .getAllResponseHeaders()
                        .trim()
                        .split(/[\r\n]+/)
                    const responseHeaders = {}
                    headersArray.forEach(function (line) {
                        const parts = line.split(": ")
                        const header = parts.shift()
                        const value = parts.join(": ")
                        if (header && typeof header !== "undefined") {
                            responseHeaders[header] = value
                        }
                    })
                    const responseData = xhr.response
                    const responseStatus = xhr.status
                    resolve({
                        request: request2,
                        data: responseData,
                        headers: responseHeaders,
                        status: responseStatus,
                    })
                }
            }
            xhr.onerror = (progressEvent) => {
                if (aborted) return
                reject(new NetworkError(progressEvent))
            }
            if (onProgress && typeof onProgress === "function") {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        onProgress({
                            isComputable: true,
                            value: event.loaded / event.total,
                        })
                    } else {
                        onProgress({ isComputable: false })
                    }
                }
            }
            if (data) {
                xhr.send(data)
            } else {
                xhr.send()
            }
        })
    function identity(obj, ..._args) {
        return obj
    }
    var getFileOptions = ({ name }) => (name ? [name] : [])
    var transformFile = identity
    var getFormData = () => new FormData()
    var isBuffer = (data) => false
    var isBlob = (data) => {
        return typeof Blob !== "undefined" && data instanceof Blob
    }
    var isFile = (data) => {
        return typeof File !== "undefined" && data instanceof File
    }
    var isReactNativeAsset = (data) => {
        return (
            !!data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            "uri" in data &&
            typeof data.uri === "string"
        )
    }
    var isFileData = (data) => {
        return (
            isBlob(data) ||
            isFile(data) ||
            isBuffer() ||
            isReactNativeAsset(data)
        )
    }
    var isSimpleValue = (value) => {
        return (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "undefined"
        )
    }
    var isObjectValue = (value) => {
        return !!value && typeof value === "object" && !Array.isArray(value)
    }
    var isFileValue = (value) =>
        !!value &&
        typeof value === "object" &&
        "data" in value &&
        isFileData(value.data)
    function collectParams(params, inputKey, inputValue) {
        if (Array.isArray(inputValue)) {
            for (const value of inputValue) {
                collectParams(params, `${inputKey}[]`, value)
            }
        } else if (isFileValue(inputValue)) {
            const { name, contentType } = inputValue
            const file = transformFile(
                inputValue.data,
                name,
                contentType ?? defaultContentType
            )
            const options = getFileOptions({ name })
            params.push([inputKey, file, ...options])
        } else if (isObjectValue(inputValue)) {
            for (const [key, value] of Object.entries(inputValue)) {
                if (typeof value !== "undefined") {
                    params.push([`${inputKey}[${key}]`, String(value)])
                }
            }
        } else if (isSimpleValue(inputValue) && inputValue) {
            params.push([inputKey, inputValue.toString()])
        }
    }
    function getFormDataParams(options) {
        const params = []
        for (const [key, value] of Object.entries(options)) {
            collectParams(params, key, value)
        }
        return params
    }
    function buildFormData(options) {
        const formData = getFormData()
        const paramsList = getFormDataParams(options)
        for (const params of paramsList) {
            const [key, value, ...rest] = params
            formData.append(key, value, ...rest)
        }
        return formData
    }
    var UploadError = class _UploadError extends UploadcareError {
        code
        request
        response
        headers
        constructor(message, code, request2, response2, headers) {
            super()
            this.name = "UploadError"
            this.message = message
            this.code = code
            this.request = request2
            this.response = response2
            this.headers = headers
            Object.setPrototypeOf(this, _UploadError.prototype)
        }
    }
    var buildSearchParams = (query) => {
        const searchParams = new URLSearchParams()
        for (const [key, value] of Object.entries(query)) {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                Object.entries(value)
                    .filter((entry) => entry[1] ?? false)
                    .forEach((entry) =>
                        searchParams.set(
                            `${key}[${entry[0]}]`,
                            String(entry[1])
                        )
                    )
            } else if (Array.isArray(value)) {
                value.forEach((val) => {
                    searchParams.append(`${key}[]`, val)
                })
            } else if (typeof value === "string" && value) {
                searchParams.set(key, value)
            } else if (typeof value === "number") {
                searchParams.set(key, value.toString())
            }
        }
        return searchParams.toString()
    }
    var getUrl = (base2, path, query) => {
        const url = new URL(base2)
        url.pathname = (url.pathname + path).replace("//", "/")
        if (query) {
            url.search = buildSearchParams(query)
        }
        return url.toString()
    }
    var version = "6.19.0"
    var LIBRARY_NAME = "UploadcareUploadClient"
    var LIBRARY_VERSION = version
    function getUserAgent(options) {
        return getUserAgent$1({
            libraryName: LIBRARY_NAME,
            libraryVersion: LIBRARY_VERSION,
            ...options,
        })
    }
    var REQUEST_WAS_THROTTLED_CODE = "RequestThrottledError"
    var DEFAULT_RETRY_AFTER_TIMEOUT = 15e3
    var DEFAULT_NETWORK_ERROR_TIMEOUT = 1e3
    function getTimeoutFromThrottledRequest(error) {
        const { headers } = error || {}
        if (!headers || typeof headers["retry-after"] !== "string") {
            return DEFAULT_RETRY_AFTER_TIMEOUT
        }
        const seconds = parseInt(headers["retry-after"], 10)
        if (!Number.isFinite(seconds)) {
            return DEFAULT_RETRY_AFTER_TIMEOUT
        }
        return seconds * 1e3
    }
    function retryIfFailed(fn, options) {
        const { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes } =
            options
        return retrier(({ attempt, retry }) =>
            fn().catch((error) => {
                if (
                    "response" in error &&
                    error?.code === REQUEST_WAS_THROTTLED_CODE &&
                    attempt < retryThrottledRequestMaxTimes
                ) {
                    return retry(getTimeoutFromThrottledRequest(error))
                }
                if (
                    error instanceof NetworkError &&
                    attempt < retryNetworkErrorMaxTimes
                ) {
                    return retry((attempt + 1) * DEFAULT_NETWORK_ERROR_TIMEOUT)
                }
                throw error
            })
        )
    }
    var getContentType = (file) => {
        let contentType = ""
        if (isBlob(file) || isFile(file) || isReactNativeAsset(file)) {
            contentType = file.type
        }
        return contentType || defaultContentType
    }
    var getFileName = (file) => {
        let filename = ""
        if (isFile(file) && file.name) {
            filename = file.name
        } else if (isBlob(file) || isBuffer()) {
            filename = ""
        } else if (isReactNativeAsset(file) && file.name) {
            filename = file.name
        }
        return filename || defaultFilename
    }
    function getStoreValue(store) {
        if (typeof store === "undefined" || store === "auto") {
            return "auto"
        }
        return store ? "1" : "0"
    }
    function getTagsValue(tags) {
        if (Array.isArray(tags)) {
            return tags.join(",")
        }
        return typeof tags === "string" ? tags : void 0
    }
    function base(
        file,
        {
            publicKey,
            fileName,
            contentType,
            baseURL = defaultSettings.baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source = "local",
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
            metadata,
            tags,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "POST",
                    url: getUrl(baseURL, "/base/", {
                        jsonerrors: 1,
                    }),
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    data: buildFormData({
                        file: {
                            data: file,
                            name: fileName || getFileName(file),
                            contentType: contentType || getContentType(file),
                        },
                        UPLOADCARE_PUB_KEY: publicKey,
                        UPLOADCARE_STORE: getStoreValue(store),
                        signature: secureSignature,
                        expire: secureExpire,
                        source,
                        metadata,
                        tags: getTagsValue(tags),
                    }),
                    signal,
                    onProgress,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
        )
    }
    var TypeEnum
    ;(function (TypeEnum2) {
        TypeEnum2["Token"] = "token"
        TypeEnum2["FileInfo"] = "file_info"
    })(TypeEnum || (TypeEnum = {}))
    function fromUrl(
        sourceUrl,
        {
            publicKey,
            baseURL = defaultSettings.baseURL,
            store,
            fileName,
            checkForUrlDuplicates,
            saveUrlForRecurrentUploads,
            secureSignature,
            secureExpire,
            source = "url",
            signal,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
            metadata,
            tags,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "POST",
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    url: getUrl(baseURL, "/from_url/", {
                        jsonerrors: 1,
                        pub_key: publicKey,
                        source_url: sourceUrl,
                        store: getStoreValue(store),
                        filename: fileName,
                        check_URL_duplicates: checkForUrlDuplicates
                            ? 1
                            : void 0,
                        save_URL_duplicates: saveUrlForRecurrentUploads
                            ? 1
                            : void 0,
                        signature: secureSignature,
                        expire: secureExpire,
                        source,
                        metadata,
                        tags: getTagsValue(tags),
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
        )
    }
    var Status
    ;(function (Status2) {
        Status2["Unknown"] = "unknown"
        Status2["Waiting"] = "waiting"
        Status2["Progress"] = "progress"
        Status2["Error"] = "error"
        Status2["Success"] = "success"
    })(Status || (Status = {}))
    var isErrorResponse = (response2) => {
        return "status" in response2 && response2.status === Status.Error
    }
    function fromUrlStatus(
        token,
        {
            publicKey,
            baseURL = defaultSettings.baseURL,
            signal,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
        } = {}
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "GET",
                    headers: publicKey
                        ? {
                              "X-UC-User-Agent": getUserAgent({
                                  publicKey,
                                  integration,
                                  userAgent,
                              }),
                          }
                        : void 0,
                    url: getUrl(baseURL, "/from_url/status/", {
                        jsonerrors: 1,
                        token,
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2 && !isErrorResponse(response2)) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
        )
    }
    function group(
        uuids,
        {
            publicKey,
            baseURL = defaultSettings.baseURL,
            jsonpCallback,
            secureSignature,
            secureExpire,
            signal,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "POST",
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    url: getUrl(baseURL, "/group/", {
                        jsonerrors: 1,
                    }),
                    data: buildFormData({
                        files: uuids,
                        callback: jsonpCallback,
                        pub_key: publicKey,
                        signature: secureSignature,
                        expire: secureExpire,
                        source,
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryNetworkErrorMaxTimes, retryThrottledRequestMaxTimes }
        )
    }
    function info(
        uuid,
        {
            publicKey,
            baseURL = defaultSettings.baseURL,
            signal,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "GET",
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    url: getUrl(baseURL, "/info/", {
                        jsonerrors: 1,
                        pub_key: publicKey,
                        file_id: uuid,
                        source,
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes }
        )
    }
    function multipartStart(
        size,
        {
            publicKey,
            contentType,
            fileName,
            multipartChunkSize = defaultSettings.multipartChunkSize,
            baseURL = "",
            secureSignature,
            secureExpire,
            store,
            signal,
            source = "local",
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
            metadata,
            tags,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "POST",
                    url: getUrl(baseURL, "/multipart/start/", {
                        jsonerrors: 1,
                    }),
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    data: buildFormData({
                        filename: fileName,
                        size,
                        content_type: contentType || defaultContentType,
                        part_size: multipartChunkSize,
                        UPLOADCARE_STORE: getStoreValue(store),
                        UPLOADCARE_PUB_KEY: publicKey,
                        signature: secureSignature,
                        expire: secureExpire,
                        source,
                        metadata,
                        tags: getTagsValue(tags),
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        response2.parts = Object.keys(response2.parts).map(
                            (key) => response2.parts[Number(key)]
                        )
                        return response2
                    }
                }),
            { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes }
        )
    }
    function multipartUpload(
        part,
        url,
        {
            contentType,
            signal,
            onProgress,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "PUT",
                    url,
                    data: part,
                    // Upload request can't be non-computable because we always know exact size
                    onProgress,
                    signal,
                    headers: {
                        "Content-Type": contentType || defaultContentType,
                    },
                })
                    .then((result) => {
                        if (onProgress)
                            onProgress({
                                isComputable: true,
                                value: 1,
                            })
                        return result
                    })
                    .then(({ status }) => ({ code: status })),
            {
                retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes,
            }
        )
    }
    function multipartComplete(
        uuid,
        {
            publicKey,
            baseURL = defaultSettings.baseURL,
            source = "local",
            signal,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes = defaultSettings.retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes = defaultSettings.retryNetworkErrorMaxTimes,
        }
    ) {
        return retryIfFailed(
            () =>
                request({
                    method: "POST",
                    url: getUrl(baseURL, "/multipart/complete/", {
                        jsonerrors: 1,
                    }),
                    headers: {
                        "X-UC-User-Agent": getUserAgent({
                            publicKey,
                            integration,
                            userAgent,
                        }),
                    },
                    data: buildFormData({
                        uuid,
                        UPLOADCARE_PUB_KEY: publicKey,
                        source,
                    }),
                    signal,
                }).then(({ data, headers, request: request2 }) => {
                    const response2 = camelizeKeys(JSON.parse(data))
                    if ("error" in response2) {
                        throw new UploadError(
                            response2.error.content,
                            response2.error.errorCode,
                            request2,
                            response2,
                            headers
                        )
                    } else {
                        return response2
                    }
                }),
            { retryThrottledRequestMaxTimes, retryNetworkErrorMaxTimes }
        )
    }
    function isReadyPoll(
        uuid,
        {
            publicKey,
            baseURL,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            signal,
            onProgress,
        }
    ) {
        return poll({
            check: (signal2) =>
                info(uuid, {
                    publicKey,
                    baseURL,
                    signal: signal2,
                    source,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                }).then((response2) => {
                    if (response2.isReady) {
                        onProgress &&
                            onProgress({ isComputable: true, value: 1 })
                        return response2
                    }
                    return false
                }),
            signal,
        })
    }
    var o6 = (e11, r8) => {
        const n10 = new URL(r8)
        return (
            (n10.hostname = `${e11}.${n10.hostname}`),
            n10.toString().replace(/\/$/, "")
        )
    }
    var s7 = "0123456789abcdefghijklmnopqrstuvwxyz"
    var a3 = (e11) => {
        if (e11 <= 0n) return "0"
        let r8 = ""
        for (; e11 > 0n; ) {
            const n10 = e11 % 36n
            ;((r8 = s7[Number(n10)] + r8), (e11 = e11 / 36n))
        }
        return r8
    }
    var c$1 = (e11, r8) => {
        try {
            const n10 = new URL(e11).hostname,
                t7 = new URL(r8).hostname
            return n10 === t7 || n10.endsWith(`.${t7}`)
        } catch {
            return false
        }
    }
    var c5 = async (n10) => {
        const s11 = new TextEncoder().encode(n10),
            t7 = await window.crypto.subtle.digest("SHA-256", s11),
            e11 = Array.from(new Uint8Array(t7))
                .map((a6) => a6.toString(16).padStart(2, "0"))
                .join("")
        return BigInt(`0x${e11}`)
    }
    var i6 = 10
    var d3 = async (n10) => {
        const s11 = await c5(n10)
        return a3(s11).slice(0, i6)
    }
    var f3 = async (n10, s11) => {
        const t7 = await d3(n10)
        return o6(t7, s11)
    }
    var getPrefixedCdnBase = (publicKey, cdnBase) => f3(publicKey, cdnBase)
    var resolveCdnBase = ({
        publicKey,
        baseCDN,
        prefixedBaseCDN = defaultSettings.prefixedBaseCDN,
    }) => {
        if (!publicKey) {
            return Promise.resolve(baseCDN ?? defaultSettings.baseCDN)
        }
        if (baseCDN === void 0 || c$1(baseCDN, prefixedBaseCDN)) {
            return getPrefixedCdnBase(publicKey, prefixedBaseCDN)
        }
        return Promise.resolve(baseCDN)
    }
    function isGroupFileInfo(fileInfo) {
        return "defaultEffects" in fileInfo
    }
    var UploadcareFile = class {
        uuid
        name
        size
        isStored
        isImage
        mimeType
        cdnUrl
        s3Url
        originalFilename
        imageInfo
        videoInfo
        contentInfo
        metadata
        tags
        s3Bucket
        defaultEffects = null
        constructor(
            fileInfo,
            { baseCDN = defaultSettings.baseCDN, fileName } = {}
        ) {
            const { uuid, s3Bucket } = fileInfo
            const cdnUrl = getUrl(baseCDN, `${uuid}/`)
            const s3Url = s3Bucket
                ? getUrl(
                      `https://${s3Bucket}.s3.amazonaws.com/`,
                      `${uuid}/${fileInfo.filename}`
                  )
                : null
            this.uuid = uuid
            this.name = fileName || fileInfo.filename
            this.size = fileInfo.size
            this.isStored = fileInfo.isStored
            this.isImage = fileInfo.isImage
            this.mimeType = fileInfo.mimeType
            this.cdnUrl = cdnUrl
            this.originalFilename = fileInfo.originalFilename
            this.imageInfo = fileInfo.imageInfo
            this.videoInfo = fileInfo.videoInfo
            this.contentInfo = fileInfo.contentInfo
            this.metadata = fileInfo.metadata || null
            this.tags = fileInfo.tags || null
            this.s3Bucket = s3Bucket || null
            this.s3Url = s3Url
            if (isGroupFileInfo(fileInfo)) {
                this.defaultEffects = fileInfo.defaultEffects
            }
        }
    }
    var toUploadcareFile = async (
        fileInfo,
        { publicKey, baseCDN, prefixedBaseCDN, fileName }
    ) => {
        const resolvedBaseCDN = await resolveCdnBase({
            publicKey,
            baseCDN,
            prefixedBaseCDN,
        })
        return new UploadcareFile(fileInfo, {
            baseCDN: resolvedBaseCDN,
            fileName,
        })
    }
    var uploadDirect = (
        file,
        {
            publicKey,
            fileName,
            baseURL,
            secureSignature,
            secureExpire,
            store,
            contentType,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            baseCDN,
            prefixedBaseCDN,
            metadata,
            tags,
        }
    ) => {
        return base(file, {
            publicKey,
            fileName,
            contentType,
            baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            metadata,
            tags,
        })
            .then(({ file: file2 }) => {
                return isReadyPoll(file2, {
                    publicKey,
                    baseURL,
                    source,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                    onProgress,
                    signal,
                })
            })
            .then((fileInfo) =>
                toUploadcareFile(fileInfo, {
                    publicKey,
                    baseCDN,
                    prefixedBaseCDN,
                })
            )
    }
    var uploadFromUploaded = (
        uuid,
        {
            publicKey,
            fileName,
            baseURL,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            baseCDN,
            prefixedBaseCDN,
        }
    ) => {
        return isReadyPoll(uuid, {
            publicKey,
            baseURL,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
        }).then((fileInfo) =>
            toUploadcareFile(fileInfo, {
                publicKey,
                baseCDN,
                prefixedBaseCDN,
                fileName,
            })
        )
    }
    var race = (fns, { signal } = {}) => {
        let lastError = null
        let winnerIndex = null
        const controllers = fns.map(() => new AbortController())
        const createStopRaceCallback = (i12) => () => {
            winnerIndex = i12
            controllers.forEach(
                (controller, index) => index !== i12 && controller.abort()
            )
        }
        onCancel(signal, () => {
            controllers.forEach((controller) => controller.abort())
        })
        return Promise.all(
            fns.map((fn, i12) => {
                const stopRace = createStopRaceCallback(i12)
                return Promise.resolve()
                    .then(() =>
                        fn({ stopRace, signal: controllers[i12].signal })
                    )
                    .then((result) => {
                        stopRace()
                        return result
                    })
                    .catch((error) => {
                        lastError = error
                        return null
                    })
            })
        ).then((results) => {
            if (winnerIndex === null) {
                throw lastError
            } else {
                return results[winnerIndex]
            }
        })
    }
    var WebSocket = window.WebSocket
    var Events = class {
        events = /* @__PURE__ */ Object.create({})
        emit(event, data) {
            this.events[event]?.forEach((fn) => fn(data))
        }
        on(event, callback) {
            this.events[event] = this.events[event] || []
            this.events[event].push(callback)
        }
        off(event, callback) {
            if (callback) {
                this.events[event] = this.events[event].filter(
                    (fn) => fn !== callback
                )
            } else {
                this.events[event] = []
            }
        }
    }
    var response = (type, data) => {
        if (type === "success") {
            return { status: Status.Success, ...data }
        }
        if (type === "progress") {
            return { status: Status.Progress, ...data }
        }
        return { status: Status.Error, ...data }
    }
    var Pusher = class {
        key
        disconnectTime
        ws = void 0
        queue = []
        isConnected = false
        subscribers = 0
        emmitter = new Events()
        disconnectTimeoutId = null
        constructor(pusherKey, disconnectTime = 3e4) {
            this.key = pusherKey
            this.disconnectTime = disconnectTime
        }
        connect() {
            this.disconnectTimeoutId && clearTimeout(this.disconnectTimeoutId)
            if (!this.isConnected && !this.ws) {
                const pusherUrl = `wss://ws.pusherapp.com/app/${this.key}?protocol=5&client=js&version=1.12.2`
                this.ws = new WebSocket(pusherUrl)
                this.ws.addEventListener("error", (error) => {
                    this.emmitter.emit("error", new Error(error.message))
                })
                this.emmitter.on("connected", () => {
                    this.isConnected = true
                    this.queue.forEach((message) =>
                        this.send(message.event, message.data)
                    )
                    this.queue = []
                })
                this.ws.addEventListener("message", (e11) => {
                    const data = JSON.parse(e11.data.toString())
                    switch (data.event) {
                        case "pusher:connection_established": {
                            this.emmitter.emit("connected", void 0)
                            break
                        }
                        case "pusher:ping": {
                            this.send("pusher:pong", {})
                            break
                        }
                        case "progress":
                        case "success":
                        case "fail": {
                            this.emmitter.emit(
                                data.channel,
                                response(data.event, JSON.parse(data.data))
                            )
                        }
                    }
                })
            }
        }
        disconnect() {
            const actualDisconect = () => {
                this.ws?.close()
                this.ws = void 0
                this.isConnected = false
            }
            if (this.disconnectTime) {
                this.disconnectTimeoutId = setTimeout(() => {
                    actualDisconect()
                }, this.disconnectTime)
            } else {
                actualDisconect()
            }
        }
        send(event, data) {
            const str = JSON.stringify({ event, data })
            this.ws?.send(str)
        }
        subscribe(token, handler) {
            this.subscribers += 1
            this.connect()
            const channel = `task-status-${token}`
            const message = {
                event: "pusher:subscribe",
                data: { channel },
            }
            this.emmitter.on(channel, handler)
            if (this.isConnected) {
                this.send(message.event, message.data)
            } else {
                this.queue.push(message)
            }
        }
        unsubscribe(token) {
            this.subscribers -= 1
            const channel = `task-status-${token}`
            const message = {
                event: "pusher:unsubscribe",
                data: { channel },
            }
            this.emmitter.off(channel)
            if (this.isConnected) {
                this.send(message.event, message.data)
            } else {
                this.queue = this.queue.filter(
                    (msg) => msg.data.channel !== channel
                )
            }
            if (this.subscribers === 0) {
                this.disconnect()
            }
        }
        onError(callback) {
            this.emmitter.on("error", callback)
            return () => this.emmitter.off("error", callback)
        }
    }
    var pusher = null
    var getPusher = (key) => {
        if (!pusher) {
            const disconectTimeout = typeof window === "undefined" ? 0 : 3e4
            pusher = new Pusher(key, disconectTimeout)
        }
        return pusher
    }
    var preconnect = (key) => {
        getPusher(key).connect()
    }
    function pollStrategy({
        token,
        publicKey,
        baseURL,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes,
        onProgress,
        signal,
    }) {
        return poll({
            check: (signal2) =>
                fromUrlStatus(token, {
                    publicKey,
                    baseURL,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                    signal: signal2,
                }).then((response2) => {
                    switch (response2.status) {
                        case Status.Error: {
                            return new UploadError(
                                response2.error,
                                response2.errorCode
                            )
                        }
                        case Status.Waiting: {
                            return false
                        }
                        case Status.Unknown: {
                            return new UploadError(
                                `Token "${token}" was not found.`
                            )
                        }
                        case Status.Progress: {
                            if (onProgress) {
                                if (response2.total === "unknown") {
                                    onProgress({ isComputable: false })
                                } else {
                                    onProgress({
                                        isComputable: true,
                                        value: response2.done / response2.total,
                                    })
                                }
                            }
                            return false
                        }
                        case Status.Success: {
                            if (onProgress)
                                onProgress({
                                    isComputable: true,
                                    value: response2.done / response2.total,
                                })
                            return response2
                        }
                        default: {
                            throw new Error("Unknown status")
                        }
                    }
                }),
            signal,
        })
    }
    var pushStrategy = ({ token, pusherKey, signal, onProgress }) =>
        new Promise((resolve, reject) => {
            const pusher2 = getPusher(pusherKey)
            const unsubErrorHandler = pusher2.onError(reject)
            const destroy = () => {
                unsubErrorHandler()
                pusher2.unsubscribe(token)
            }
            onCancel(signal, () => {
                destroy()
                reject(new CancelError("pusher cancelled"))
            })
            pusher2.subscribe(token, (result) => {
                switch (result.status) {
                    case Status.Progress: {
                        if (onProgress) {
                            if (result.total === "unknown") {
                                onProgress({ isComputable: false })
                            } else {
                                onProgress({
                                    isComputable: true,
                                    value: result.done / result.total,
                                })
                            }
                        }
                        break
                    }
                    case Status.Success: {
                        destroy()
                        if (onProgress)
                            onProgress({
                                isComputable: true,
                                value: result.done / result.total,
                            })
                        resolve(result)
                        break
                    }
                    case Status.Error: {
                        destroy()
                        reject(new UploadError(result.msg, result.error_code))
                    }
                }
            })
        })
    var uploadFromUrl = (
        sourceUrl,
        {
            publicKey,
            fileName,
            baseURL,
            baseCDN,
            prefixedBaseCDN,
            checkForUrlDuplicates,
            saveUrlForRecurrentUploads,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            pusherKey = defaultSettings.pusherKey,
            metadata,
            tags,
        }
    ) =>
        Promise.resolve(preconnect(pusherKey))
            .then(() =>
                fromUrl(sourceUrl, {
                    publicKey,
                    fileName,
                    baseURL,
                    checkForUrlDuplicates,
                    saveUrlForRecurrentUploads,
                    secureSignature,
                    secureExpire,
                    store,
                    signal,
                    source,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    metadata,
                    tags,
                })
            )
            .catch((error) => {
                const pusher2 = getPusher(pusherKey)
                pusher2?.disconnect()
                return Promise.reject(error)
            })
            .then((urlResponse) => {
                if (urlResponse.type === TypeEnum.FileInfo) {
                    return urlResponse
                } else {
                    return race(
                        [
                            ({ signal: signal2 }) =>
                                pollStrategy({
                                    token: urlResponse.token,
                                    publicKey,
                                    baseURL,
                                    integration,
                                    userAgent,
                                    retryThrottledRequestMaxTimes,
                                    onProgress,
                                    signal: signal2,
                                }),
                            ({ signal: signal2 }) =>
                                pushStrategy({
                                    token: urlResponse.token,
                                    pusherKey,
                                    signal: signal2,
                                    onProgress,
                                }),
                        ],
                        { signal }
                    )
                }
            })
            .then((result) => {
                if (result instanceof UploadError) throw result
                return result
            })
            .then((result) => {
                if (result.isReady) {
                    return result
                }
                return isReadyPoll(result.uuid, {
                    publicKey,
                    baseURL,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    onProgress,
                    signal,
                })
            })
            .then((fileInfo) =>
                toUploadcareFile(fileInfo, {
                    publicKey,
                    baseCDN,
                    prefixedBaseCDN,
                })
            )
    var memo = /* @__PURE__ */ new WeakMap()
    var getBlobFromReactNativeAsset = async (asset) => {
        if (memo.has(asset)) {
            return memo.get(asset)
        }
        const blob = await fetch(asset.uri).then((res) => res.blob())
        memo.set(asset, blob)
        return blob
    }
    var getFileSize = async (file) => {
        if (isFile(file) || isBlob(file)) {
            return file.size
        }
        if (isReactNativeAsset(file)) {
            const blob = await getBlobFromReactNativeAsset(file)
            return blob.size
        }
        throw new Error(`Unknown file type. Cannot determine file size.`)
    }
    var isMultipart = (
        fileSize,
        multipartMinFileSize = defaultSettings.multipartMinFileSize
    ) => {
        return fileSize >= multipartMinFileSize
    }
    var isUuid = (data) => {
        const UUID_REGEX =
            "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"
        const regExp = new RegExp(UUID_REGEX)
        return !isFileData(data) && regExp.test(data)
    }
    var isUrl = (data) => {
        const URL_REGEX =
            "^(?:\\w+:)?\\/\\/([^\\s\\.]+\\.\\S{2}|localhost[\\:?\\d]*)\\S*$"
        const regExp = new RegExp(URL_REGEX)
        return !isFileData(data) && regExp.test(data)
    }
    var runWithConcurrency = (concurrency, tasks) => {
        return new Promise((resolve, reject) => {
            const results = []
            let rejected = false
            let settled = tasks.length
            const forRun = [...tasks]
            const run = () => {
                const index = tasks.length - forRun.length
                const next = forRun.shift()
                if (next) {
                    next()
                        .then((result) => {
                            if (rejected) return
                            results[index] = result
                            settled -= 1
                            if (settled) {
                                run()
                            } else {
                                resolve(results)
                            }
                        })
                        .catch((error) => {
                            rejected = true
                            reject(error)
                        })
                }
            }
            for (let i12 = 0; i12 < concurrency; i12++) {
                run()
            }
        })
    }
    var sliceChunk = (file, index, fileSize, chunkSize) => {
        const start = chunkSize * index
        const end = Math.min(start + chunkSize, fileSize)
        return file.slice(start, end)
    }
    var prepareChunks = async (file, fileSize, chunkSize) => {
        return (index) => sliceChunk(file, index, fileSize, chunkSize)
    }
    var uploadPart = (
        chunk,
        url,
        {
            publicKey,
            contentType,
            onProgress,
            signal,
            integration,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
        }
    ) =>
        multipartUpload(chunk, url, {
            contentType,
            onProgress,
            signal,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
        })
    var uploadMultipart = async (
        file,
        {
            publicKey,
            fileName,
            fileSize,
            baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            contentType,
            multipartChunkSize = defaultSettings.multipartChunkSize,
            maxConcurrentRequests = defaultSettings.maxConcurrentRequests,
            baseCDN,
            prefixedBaseCDN,
            metadata,
            tags,
        }
    ) => {
        const size = fileSize ?? (await getFileSize(file))
        let progressValues
        const createProgressHandler = (totalChunks, chunkIdx) => {
            if (!onProgress) return
            if (!progressValues) {
                progressValues = Array(totalChunks).fill(0)
            }
            const sum = (values) =>
                values.reduce((sum2, next) => sum2 + next, 0)
            return (info2) => {
                if (!info2.isComputable) {
                    return
                }
                progressValues[chunkIdx] = info2.value
                onProgress({
                    isComputable: true,
                    value: sum(progressValues) / totalChunks,
                })
            }
        }
        contentType ||= getContentType(file)
        return multipartStart(size, {
            publicKey,
            contentType,
            fileName: fileName || getFileName(file),
            baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            metadata,
            tags,
            multipartChunkSize,
        })
            .then(async ({ uuid, parts }) => {
                const getChunk = await prepareChunks(
                    file,
                    size,
                    multipartChunkSize
                )
                return Promise.all([
                    uuid,
                    runWithConcurrency(
                        maxConcurrentRequests,
                        parts.map(
                            (url, index) => () =>
                                uploadPart(getChunk(index), url, {
                                    publicKey,
                                    contentType,
                                    onProgress: createProgressHandler(
                                        parts.length,
                                        index
                                    ),
                                    signal,
                                    integration,
                                    retryThrottledRequestMaxTimes,
                                    retryNetworkErrorMaxTimes,
                                })
                        )
                    ),
                ])
            })
            .then(([uuid]) =>
                multipartComplete(uuid, {
                    publicKey,
                    baseURL,
                    source,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                })
            )
            .then((fileInfo) => {
                if (fileInfo.isReady) {
                    return fileInfo
                }
                return isReadyPoll(fileInfo.uuid, {
                    publicKey,
                    baseURL,
                    source,
                    integration,
                    userAgent,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                    onProgress,
                    signal,
                })
            })
            .then((fileInfo) =>
                toUploadcareFile(fileInfo, {
                    publicKey,
                    baseCDN,
                    prefixedBaseCDN,
                })
            )
    }
    async function uploadFile(
        data,
        {
            publicKey,
            fileName,
            baseURL = defaultSettings.baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            contentType,
            multipartMinFileSize,
            multipartChunkSize,
            maxConcurrentRequests,
            // Left undefined on purpose when the caller omits it, so `resolveCdnBase`
            // can distinguish "not set" (→ prefixed default) from an explicit base
            // (→ used verbatim, e.g. the legacy `https://ucarecdn.com`).
            baseCDN,
            prefixedBaseCDN = defaultSettings.prefixedBaseCDN,
            checkForUrlDuplicates,
            saveUrlForRecurrentUploads,
            pusherKey,
            metadata,
            tags,
        }
    ) {
        if (isFileData(data)) {
            const fileSize = await getFileSize(data)
            if (isMultipart(fileSize, multipartMinFileSize)) {
                return uploadMultipart(data, {
                    publicKey,
                    contentType,
                    multipartChunkSize,
                    fileSize,
                    fileName,
                    baseURL,
                    secureSignature,
                    secureExpire,
                    store,
                    signal,
                    onProgress,
                    source,
                    integration,
                    userAgent,
                    maxConcurrentRequests,
                    retryThrottledRequestMaxTimes,
                    retryNetworkErrorMaxTimes,
                    baseCDN,
                    prefixedBaseCDN,
                    metadata,
                    tags,
                })
            }
            return uploadDirect(data, {
                publicKey,
                fileName,
                contentType,
                baseURL,
                secureSignature,
                secureExpire,
                store,
                signal,
                onProgress,
                source,
                integration,
                userAgent,
                retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes,
                baseCDN,
                prefixedBaseCDN,
                metadata,
                tags,
            })
        }
        if (isUrl(data)) {
            return uploadFromUrl(data, {
                publicKey,
                fileName,
                baseURL,
                baseCDN,
                prefixedBaseCDN,
                checkForUrlDuplicates,
                saveUrlForRecurrentUploads,
                secureSignature,
                secureExpire,
                store,
                signal,
                onProgress,
                source,
                integration,
                userAgent,
                retryThrottledRequestMaxTimes,
                pusherKey,
                metadata,
                tags,
            })
        }
        if (isUuid(data)) {
            return uploadFromUploaded(data, {
                publicKey,
                fileName,
                baseURL,
                signal,
                onProgress,
                source,
                integration,
                userAgent,
                retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes,
                baseCDN,
                prefixedBaseCDN,
            })
        }
        throw new TypeError(`File uploading from "${data}" is not supported`)
    }
    var replaceUrlBase = (url, newBase) => {
        try {
            const originalUrl = new URL(url)
            const baseUrl = new URL(newBase)
            originalUrl.protocol = baseUrl.protocol
            originalUrl.hostname = baseUrl.hostname
            originalUrl.port = baseUrl.port
            return originalUrl.toString()
        } catch {
            return url
        }
    }
    var UploadcareGroup = class {
        uuid
        filesCount
        totalSize
        isStored
        isImage
        cdnUrl
        files
        createdAt
        storedAt = null
        constructor(groupInfo, { baseCDN = defaultSettings.baseCDN } = {}) {
            this.uuid = groupInfo.id
            this.filesCount = groupInfo.filesCount
            const groupFiles = groupInfo.files.filter(Boolean)
            this.totalSize = Object.values(groupFiles).reduce(
                (acc, file) => acc + file.size,
                0
            )
            this.isStored = !!groupInfo.datetimeStored
            this.isImage = !!Object.values(groupFiles).filter(
                (file) => file.isImage
            ).length
            this.cdnUrl = replaceUrlBase(groupInfo.cdnUrl, baseCDN)
            this.files = groupFiles.map(
                (fileInfo) => new UploadcareFile(fileInfo, { baseCDN })
            )
            this.createdAt = groupInfo.datetimeCreated
            this.storedAt = groupInfo.datetimeStored
        }
    }
    var toUploadcareGroup = async (
        groupInfo,
        { publicKey, baseCDN, prefixedBaseCDN }
    ) => {
        const resolvedBaseCDN = await resolveCdnBase({
            publicKey,
            baseCDN,
            prefixedBaseCDN,
        })
        return new UploadcareGroup(groupInfo, { baseCDN: resolvedBaseCDN })
    }
    var isFileDataArray = (data) => {
        for (const item of data) {
            if (!isFileData(item)) {
                return false
            }
        }
        return true
    }
    var isUuidArray = (data) => {
        for (const item of data) {
            if (!isUuid(item)) {
                return false
            }
        }
        return true
    }
    var isUrlArray = (data) => {
        for (const item of data) {
            if (!isUrl(item)) {
                return false
            }
        }
        return true
    }
    function uploadFileGroup(
        data,
        {
            publicKey,
            fileName,
            baseURL = defaultSettings.baseURL,
            secureSignature,
            secureExpire,
            store,
            signal,
            onProgress,
            source,
            integration,
            userAgent,
            retryThrottledRequestMaxTimes,
            retryNetworkErrorMaxTimes,
            contentType,
            multipartChunkSize = defaultSettings.multipartChunkSize,
            // Left undefined on purpose when the caller omits it, so `resolveCdnBase`
            // can distinguish "not set" (→ prefixed default) from an explicit base
            // (→ used verbatim, e.g. the legacy `https://ucarecdn.com`).
            baseCDN,
            prefixedBaseCDN = defaultSettings.prefixedBaseCDN,
            checkForUrlDuplicates,
            saveUrlForRecurrentUploads,
            jsonpCallback,
        }
    ) {
        if (!isFileDataArray(data) && !isUrlArray(data) && !isUuidArray(data)) {
            throw new TypeError(
                `Group uploading from "${data}" is not supported`
            )
        }
        let progressValues
        let isStillComputable = true
        const filesCount = data.length
        const createProgressHandler = (size, index) => {
            if (!onProgress) return
            if (!progressValues) {
                progressValues = Array(size).fill(0)
            }
            const normalize2 = (values) =>
                values.reduce((sum, next) => sum + next) / size
            return (info2) => {
                if (!info2.isComputable || !isStillComputable) {
                    isStillComputable = false
                    onProgress({ isComputable: false })
                    return
                }
                progressValues[index] = info2.value
                onProgress({
                    isComputable: true,
                    value: normalize2(progressValues),
                })
            }
        }
        return Promise.all(
            data.map((file, index) => {
                if (isFileData(file) || isUrl(file)) {
                    return uploadFile(file, {
                        publicKey,
                        fileName,
                        baseURL,
                        secureSignature,
                        secureExpire,
                        store,
                        signal,
                        onProgress: createProgressHandler(filesCount, index),
                        source,
                        integration,
                        userAgent,
                        retryThrottledRequestMaxTimes,
                        retryNetworkErrorMaxTimes,
                        contentType,
                        multipartChunkSize,
                        baseCDN,
                        prefixedBaseCDN,
                        checkForUrlDuplicates,
                        saveUrlForRecurrentUploads,
                    }).then((fileInfo) => fileInfo.uuid)
                } else {
                    return file
                }
            })
        ).then((uuids) => {
            return group(uuids, {
                publicKey,
                baseURL,
                jsonpCallback,
                secureSignature,
                secureExpire,
                signal,
                source,
                integration,
                userAgent,
                retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes,
            })
                .then((groupInfo) =>
                    toUploadcareGroup(groupInfo, {
                        publicKey,
                        baseCDN,
                        prefixedBaseCDN,
                    })
                )
                .then((group2) => {
                    onProgress && onProgress({ isComputable: true, value: 1 })
                    return group2
                })
        })
    }
    var Queue = class {
        gc = 1
        vd = []
        hc = 0
        wd = /* @__PURE__ */ new Map()
        xd = /* @__PURE__ */ new Map()
        constructor(concurrency) {
            this.gc = concurrency
        }
        /** Run tasks from the queue up to the concurrency limit */
        run() {
            const tasksLeft = this.gc - this.hc
            for (let i12 = 0; i12 < tasksLeft; i12++) {
                const task = this.vd.shift()
                if (!task) {
                    return
                }
                const resolver = this.wd.get(task)
                const rejector = this.xd.get(task)
                if (!resolver || !rejector)
                    throw new Error(
                        "Unexpected behavior: resolver or rejector is undefined"
                    )
                this.hc += 1
                task()
                    .finally(() => {
                        this.wd.delete(task)
                        this.xd.delete(task)
                        this.hc -= 1
                        this.run()
                    })
                    .then((value) => resolver(value))
                    .catch((error) => rejector(error))
            }
        }
        /**
         * Add a task to the queue
         *
         * If you want to add a lot of tasks at once, consider setting `autoRun` to
         * false and calling `run()` manually after adding all tasks to avoid multiple
         * redundant calls to `run()`.
         *
         * @param task The task to add
         * @param autoRun Whether to automatically run the queue after adding the task
         *   (default: true)
         * @returns A promise that resolves or rejects with the task's result
         */
        add(task, { autoRun } = { autoRun: true }) {
            return new Promise((resolve, reject) => {
                this.wd.set(task, resolve)
                this.xd.set(task, reject)
                this.vd.push(task)
                autoRun && this.run()
            })
        }
        get pending() {
            return this.vd.length
        }
        get running() {
            return this.hc
        }
        set concurrency(value) {
            this.gc = value
            this.run()
        }
        get concurrency() {
            return this.gc
        }
    }

    // src/abstract/CTX.ts
    var blockCtx = () => ({})
    var activityBlockCtx = (fnCtx) => ({
        ...blockCtx(),
        "*currentActivity": null,
        "*currentActivityParams": {},
        "*history": [],
        "*historyBack": null,
        "*closeModal": () => {
            fnCtx.modalManager?.close(fnCtx.$["*currentActivity"])
            fnCtx.pub("*currentActivity", null)
        },
    })
    var uploaderBlockCtx = (fnCtx) => ({
        ...activityBlockCtx(fnCtx),
        "*commonProgress": 0,
        "*uploadList": [],
        "*uploadQueue": new Queue(1),
        "*collectionErrors": [],
        "*collectionState": null,
        "*groupInfo": null,
        "*uploadTrigger": /* @__PURE__ */ new Set(),
    })
    var solutionBlockCtx = (fnCtx) => ({
        ...uploaderBlockCtx(fnCtx),
        "*solution": null,
        "*lazyPlugins": null,
    })

    // src/lit/activity-constants.ts
    var ACTIVITY_TYPES = Object.freeze({
        START_FROM: "start-from",
        CAMERA: "camera",
        UPLOAD_LIST: "upload-list",
        URL: "url",
        CLOUD_IMG_EDIT: "cloud-image-edit",
        EXTERNAL: "external",
    })

    // src/abstract/features/ClipboardLayer.ts
    var ALLOWED_PASTE_ACTIVITIES = /* @__PURE__ */ new Set([
        ACTIVITY_TYPES.START_FROM,
        ACTIVITY_TYPES.UPLOAD_LIST,
    ])
    var ClipboardLayer = class extends SharedInstance {
        constructor(sharedInstancesBag) {
            super(sharedInstancesBag)
            this.scopes = /* @__PURE__ */ new Set()
            this.listener = this.Gi.bind(this)
            window.addEventListener("paste", this.listener)
        }
        Hi(target) {
            if (!(target instanceof Element)) {
                return false
            }
            if (target.closest("input, textarea, select")) {
                return true
            }
            const editableElement = target.closest("[contenteditable]")
            if (
                editableElement &&
                editableElement
                    .getAttribute("contenteditable")
                    ?.toLowerCase() !== "false"
            ) {
                return true
            }
            if (
                target.closest(
                    '[role="textbox"], [role="searchbox"], [role="combobox"]'
                )
            ) {
                return true
            }
            return false
        }
        Ii(event) {
            return event.composedPath().some((target) => this.Hi(target))
        }
        Ji(activity) {
            return (
                typeof activity === "string" &&
                ALLOWED_PASTE_ACTIVITIES.has(activity)
            )
        }
        Ki() {
            return [...this.scopes].some((scope) => scope.isConnected)
        }
        Li() {
            return [...this.scopes].some((scope) => {
                return (
                    scope.isConnected &&
                    scope instanceof Element &&
                    scope.localName === "uc-file-uploader-regular"
                )
            })
        }
        Mi(target) {
            if (!target) {
                return false
            }
            return [...this.scopes].some(
                (scope) => scope.isConnected && scope.contains(target)
            )
        }
        Ni(text) {
            const trimmedText = text.trim()
            if (!trimmedText) {
                return null
            }
            try {
                const url = new URL(trimmedText)
                if (url.protocol !== "http:" && url.protocol !== "https:") {
                    return null
                }
                return url.toString()
            } catch {
                return null
            }
        }
        openUploadList() {
            this.a.routerLayer.navigateAfterFileAdd()
        }
        async Gi(event) {
            if (!event.clipboardData) {
                return
            }
            if (this.Ii(event)) {
                return
            }
            if (!this.Ki()) {
                return
            }
            const currentActivity = this.a.ctx.read("*currentActivity")
            const isInitialState = currentActivity === null
            const isAllowedActivity = this.Ji(currentActivity)
            switch (this.La.pasteScope) {
                case "global":
                    if (!isAllowedActivity && !(isInitialState && this.Li())) {
                        return
                    }
                    await this.handlePaste(event)
                    return
                case "local": {
                    const target =
                        event.target instanceof Node ? event.target : null
                    if (
                        !this.Mi(target) ||
                        (!isAllowedActivity && !isInitialState)
                    ) {
                        return
                    }
                    await this.handlePaste(event)
                    return
                }
                default:
                    return
            }
        }
        async handlePaste(event) {
            if (!event.clipboardData) {
                return
            }
            const items = Array.from(event.clipboardData.items)
            const files = items
                .filter((item) => item.kind === "file")
                .map((item) => item.getAsFile())
                .filter((file) => file !== null)
            const urlItems = items
                .filter(
                    (item) =>
                        item.kind === "string" &&
                        (item.type === "text/plain" ||
                            item.type === "text/uri-list")
                )
                .map((item) => {
                    return new Promise((resolve) => {
                        item.getAsString((text) => {
                            resolve(this.Ni(text))
                        })
                    })
                })
            let hasAddedFiles = false
            if (files.length > 0) {
                files.forEach((file) => {
                    this.a.api.addFileFromObject(file, { source: "clipboard" })
                })
                hasAddedFiles = true
            }
            if (urlItems.length > 0) {
                const resolvedUrls = (await Promise.all(urlItems)).filter(
                    (url) => url !== null
                )
                resolvedUrls.forEach((url) => {
                    this.a.api.addFileFromUrl(url, { source: "clipboard" })
                })
                hasAddedFiles ||= resolvedUrls.length > 0
            }
            if (hasAddedFiles) {
                this.openUploadList()
            }
        }
        registerBlock(scope) {
            this.scopes.add(scope)
            return () => {
                this.scopes.delete(scope)
            }
        }
        destroy() {
            super.destroy()
            window.removeEventListener("paste", this.listener)
            this.scopes.clear()
        }
    }

    // src/abstract/features/RouterHooksLayer.ts
    var RouterHooksLayer = class extends SharedInstance {
        constructor() {
            super(...arguments)
            this.ic = []
        }
        registerAfterFileAddHook(hook) {
            this.ic.push(hook)
            return () => {
                this.ic = this.ic.filter((h8) => h8 !== hook)
            }
        }
        navigateAfterFileAdd() {
            const history = this.a.ctx.read("*history")
            const ctx = { historyLength: history.length }
            const handled = this.ic.some((hook) => hook(ctx))
            if (!handled) {
                this.a.ctx.pub("*currentActivity", ACTIVITY_TYPES.UPLOAD_LIST)
                this.a.modalManager?.open(ACTIVITY_TYPES.UPLOAD_LIST)
            }
        }
    }

    // node_modules/keyux/focus-group.js
    var ROLES = {
        button: ["toolbar"],
        checkbox: ["toolbar"],
        menuitem: ["menu", "menubar"],
        option: ["listbox"],
        tab: ["tablist"],
    }
    function focus(current, next) {
        next.tabIndex = 0
        next.focus()
        current.tabIndex = -1
    }
    function findGroupNodeByEventTarget(target) {
        let itemRole = target.role || target.type || target.tagName
        if (!itemRole) return null
        let groupRoles = ROLES[itemRole.toLowerCase()]
        if (!groupRoles) return null
        for (let role of groupRoles) {
            let node = target.closest(`[role=${role}]`)
            if (node) return node
        }
    }
    function getItems(target, group2) {
        if (group2.role === "toolbar") return getToolbarItems(group2)
        return group2.querySelectorAll(`[role=${target.role}]`)
    }
    function filterNested(allItems, group2) {
        return Array.from(allItems).filter((item) => {
            let current = item.parentElement
            while (current && current !== group2) {
                if (current.getAttribute("aria-hidden") === "true") {
                    return false
                }
                current = current.parentElement
            }
            return true
        })
    }
    function getToolbarItems(group2) {
        let items = [...group2.querySelectorAll("*")]
        return items.filter((item) => {
            return (
                item.role === "button" ||
                item.type === "button" ||
                item.role === "checkbox" ||
                item.type === "checkbox"
            )
        })
    }
    function isHorizontalOrientation(group2) {
        let ariaOrientation = group2.getAttribute("aria-orientation")
        if (ariaOrientation === "vertical") return false
        if (ariaOrientation === "horizontal") return true
        let role = group2.role
        return role === "menubar" || role === "tablist" || role === "toolbar"
    }
    function focusGroupKeyUX(options) {
        return (window2) => {
            let inGroup = false
            let typingDelayMs = 300
            let lastTyped = 0
            let searchPrefix = ""
            function keyDown(event) {
                let group2 = findGroupNodeByEventTarget(event.target)
                if (!group2) {
                    stop()
                    return
                }
                let allItems = getItems(event.target, group2)
                let items = filterNested(allItems, group2)
                let index = Array.from(items).indexOf(event.target)
                let nextKey = "ArrowDown"
                let prevKey = "ArrowUp"
                if (isHorizontalOrientation(group2)) {
                    if (window2.document.dir === "rtl") {
                        nextKey = "ArrowLeft"
                        prevKey = "ArrowRight"
                    } else {
                        nextKey = "ArrowRight"
                        prevKey = "ArrowLeft"
                    }
                }
                if (event.key === nextKey) {
                    event.preventDefault()
                    focus(event.target, items[index + 1] || items[0])
                } else if (event.key === prevKey) {
                    event.preventDefault()
                    focus(
                        event.target,
                        items[index - 1] || items[items.length - 1]
                    )
                } else if (event.key === "Home") {
                    event.preventDefault()
                    focus(event.target, items[0])
                } else if (event.key === "End") {
                    event.preventDefault()
                    focus(event.target, items[items.length - 1])
                } else if (
                    event.key.length === 1 &&
                    group2.role !== "tablist"
                ) {
                    if (event.timeStamp - lastTyped <= typingDelayMs) {
                        searchPrefix += event.key.toLowerCase()
                    } else {
                        searchPrefix = event.key.toLowerCase()
                    }
                    lastTyped = event.timeStamp
                    let found = Array.from(allItems).find((item) => {
                        return item.textContent
                            ?.trim()
                            ?.toLowerCase()
                            ?.startsWith(searchPrefix)
                    })
                    if (found) {
                        event.preventDefault()
                        focus(event.target, found)
                    }
                }
            }
            function stop() {
                inGroup = false
                window2.removeEventListener("keydown", keyDown)
            }
            function focusIn(event) {
                let group2 = findGroupNodeByEventTarget(event.target)
                if (group2) {
                    if (!inGroup) {
                        inGroup = true
                        window2.addEventListener("keydown", keyDown)
                    }
                    let items = getItems(event.target, group2)
                    for (let item of items) {
                        if (item !== event.target) {
                            item.setAttribute("tabindex", -1)
                        }
                    }
                } else if (inGroup) {
                    stop()
                }
            }
            function focusOut(event) {
                if (
                    !event.relatedTarget ||
                    event.relatedTarget === window2.document
                ) {
                    stop()
                }
            }
            function click(event) {
                let group2 = findGroupNodeByEventTarget(event.target)
                if (group2) {
                    let items = getItems(event.target, group2)
                    for (let item of items) {
                        if (item !== event.target) {
                            item.setAttribute("tabindex", -1)
                        }
                    }
                    event.target.setAttribute("tabindex", 0)
                }
            }
            window2.addEventListener("click", click)
            window2.addEventListener("focusin", focusIn)
            window2.addEventListener("focusout", focusOut)
            return () => {
                stop()
                window2.removeEventListener("click", click)
                window2.removeEventListener("focusin", focusIn)
                window2.removeEventListener("focusout", focusOut)
            }
        }
    }

    // node_modules/keyux/hidden.js
    function hiddenKeyUX() {
        return (window2) => {
            let allowed
            let wasHidden
            function jump(e11) {
                if (e11.target.getAttribute("aria-hidden") === "true") {
                    allowed = e11.target
                    allowed.setAttribute("aria-hidden", "false")
                    wasHidden = allowed.hidden
                    if (wasHidden) allowed.hidden = false
                    let first = e11.target.querySelector(
                        'a, button, select, textarea, input:not([type=radio]), [type=radio]:checked, [tabindex]:not([tabindex="-1"])'
                    )
                    if (first) first.tabIndex = 0
                }
            }
            function focusOut(e11) {
                if (
                    allowed &&
                    allowed.contains(e11.target) &&
                    (!e11.relatedTarget || !allowed.contains(e11.relatedTarget))
                ) {
                    e11.target.tabIndex = -1
                    allowed.setAttribute("aria-hidden", "true")
                    if (wasHidden) allowed.hidden = true
                    allowed = null
                }
            }
            window2.addEventListener("keyuxJump", jump)
            window2.addEventListener("focusout", focusOut)
            return () => {
                window2.removeEventListener("keyuxJump", jump)
                window2.removeEventListener("focusout", focusOut)
            }
        }
    }

    // node_modules/keyux/jump.js
    function jumpKeyUX() {
        return (window2) => {
            let jumps = []
            function focus2(next) {
                let current = window2.document.activeElement
                if (current && current !== window2.document.body) {
                    jumps.push(new WeakRef(current))
                }
                next.focus({ focusVisible: true })
            }
            function back() {
                let ref = jumps.pop()
                if (!ref) {
                    window2.document.activeElement.blur()
                    return
                }
                let el = ref.deref()
                if (el && el.isConnected) {
                    el.focus()
                } else {
                    back()
                }
            }
            let tries = 0
            let finding
            function jump(from) {
                clearInterval(finding)
                let ariaControls = from.getAttribute("aria-controls")
                finding = setInterval(() => {
                    if (tries++ > 50) {
                        clearInterval(finding)
                        return
                    }
                    let area = window2.document.getElementById(ariaControls)
                    if (area) {
                        let next = area.querySelector(
                            'a, button, select, textarea, input:not([type=radio]), [type=radio]:checked, [tabindex]:not([tabindex="-1"])'
                        )
                        if (next) {
                            clearInterval(finding)
                            area.dispatchEvent(
                                new window2.CustomEvent("keyuxJump", {
                                    bubbles: true,
                                })
                            )
                            focus2(next)
                        }
                    }
                }, 50)
            }
            function keyDown(event) {
                if (event.target.getAttribute("aria-controls")) {
                    if (event.key === "Enter") {
                        jump(event.target)
                    }
                }
                if (event.key === "Escape") {
                    back()
                }
            }
            window2.addEventListener("keydown", keyDown)
            return () => {
                window2.removeEventListener("keydown", keyDown)
            }
        }
    }

    // node_modules/keyux/press.js
    function pressKeyUX(pressedClass) {
        let pressedElement
        let classes = pressedClass.split(" ")
        let byEnter
        function keyDown(event) {
            if (
                (event.key === "Enter" || event.key === " ") &&
                (event.target.tagName === "BUTTON" ||
                    event.target.tagName === "A")
            ) {
                keyUp()
                event.target.classList.add(...classes)
                pressedElement = event.target
                byEnter = event.target
            }
        }
        function keyUp() {
            if (pressedElement) {
                pressedElement.classList.remove(...classes)
                pressedElement = 0
                setTimeout(() => {
                    byEnter = 0
                }, 0)
            }
        }
        function click(event) {
            if (event.clientX === 0 && event.clientY === 0) {
                if (pressedElement !== event.target) {
                    keyUp()
                    if (byEnter !== event.target) {
                        event.target.classList.add(...classes)
                        pressedElement = event.target
                    }
                }
            }
        }
        return (window2) => {
            window2.addEventListener("click", click)
            window2.addEventListener("keydown", keyDown)
            window2.addEventListener("keyup", keyUp)
            return () => {
                window2.removeEventListener("click", click)
                window2.removeEventListener("keydown", keyDown)
                window2.removeEventListener("keyup", keyUp)
            }
        }
    }

    // node_modules/keyux/index.js
    function startKeyUX(window2, plugins) {
        let unbinds = plugins.map((plugin) => plugin(window2))
        return () => {
            unbinds.forEach((unbind) => unbind())
        }
    }

    // src/abstract/managers/a11y.ts
    var ScopedMinimalWindow = class {
        constructor() {
            this.da = /* @__PURE__ */ new Map()
            this.yd = []
        }
        addEventListener(type, listener) {
            const wrappedListener = (event) => {
                const target = event.target
                if (!(target instanceof Node)) {
                    return
                }
                if (
                    this.yd.some((el) => el === target || el.contains(target))
                ) {
                    listener(event)
                }
            }
            this.da.set(listener, wrappedListener)
            window.addEventListener(type, wrappedListener)
        }
        removeEventListener(type, listener) {
            const wrappedListener = this.da.get(listener)
            if (wrappedListener) {
                window.removeEventListener(type, wrappedListener)
            }
            this.da.delete(listener)
        }
        get CustomEvent() {
            return window.CustomEvent
        }
        get document() {
            return window.document
        }
        get navigator() {
            return window.navigator
        }
        registerScope(scope) {
            this.yd.push(scope)
        }
        destroy() {
            this.yd = []
            for (const wrappedListener of this.da.values()) {
                window.removeEventListener("keydown", wrappedListener)
                window.removeEventListener("keyup", wrappedListener)
            }
            this.da.clear()
        }
    }
    var A11y = class {
        constructor() {
            this.jc = new ScopedMinimalWindow()
            this.uf = startKeyUX(this.jc, [
                focusGroupKeyUX(),
                pressKeyUX("is-pressed"),
                jumpKeyUX(),
                hiddenKeyUX(),
            ])
        }
        registerBlock(scope) {
            this.jc.registerScope(scope)
        }
        destroy() {
            this.uf?.()
            this.jc.destroy()
        }
    }

    // src/abstract/managers/LocaleManager.ts
    var localeStateKey = (key) => `*l10n/${key}`
    var DEFAULT_LOCALE = "en"
    var LocaleManager = class extends SharedInstance {
        constructor(sharedInstancesBag) {
            super(sharedInstancesBag)
            this.ab = ""
            for (const [key, value] of Object.entries(en_default)) {
                const noTranslation = this.b.has(localeStateKey(key))
                    ? !this.b.read(localeStateKey(key))
                    : true
                this.b.add(localeStateKey(key), value, noTranslation)
            }
            const pluginManager = sharedInstancesBag.pluginManager
            if (pluginManager?.onPluginsChange) {
                this.addSub(
                    pluginManager.onPluginsChange(() => {
                        if (this.ab) {
                            this.vf(this.ab)
                        }
                    })
                )
            }
            this.addSub(
                this.b.sub(
                    sharedConfigKey("localeName"),
                    async (localeName) => {
                        if (!localeName) {
                            return
                        }
                        this.ab = localeName
                        const definition =
                            await resolveLocaleDefinition(localeName)
                        if (
                            localeName !== DEFAULT_LOCALE &&
                            this.ab !== localeName
                        ) {
                            return
                        }
                        this.vf(localeName)
                        this.wf(localeName, definition)
                    }
                )
            )
            this.addSub(
                this.b.sub(
                    sharedConfigKey("localeDefinitionOverride"),
                    (localeDefinitionOverride) => {
                        if (!localeDefinitionOverride) {
                            return
                        }
                        const definition = localeDefinitionOverride[this.ab]
                        if (!definition) {
                            return
                        }
                        this.wf(this.ab, definition)
                    }
                )
            )
        }
        wf(localeName, definition) {
            const overrides = this.La.localeDefinitionOverride?.[localeName]
            for (const [key, value] of Object.entries(definition)) {
                const overriddenValue = overrides?.[key]
                this.b.add(localeStateKey(key), overriddenValue ?? value, true)
            }
        }
        vf(localeName) {
            const pluginManager = this.a.pluginManager
            if (!pluginManager) {
                return
            }
            const snapshot = pluginManager.snapshot()
            for (const entry of snapshot.l10n) {
                const { pluginId: _pluginId, ...locales } = entry
                const pluginDefinition = locales[localeName]
                if (!pluginDefinition) {
                    continue
                }
                for (const [key, value] of Object.entries(pluginDefinition)) {
                    if (value === void 0) {
                        continue
                    }
                    this.b.add(localeStateKey(key), value, true)
                }
            }
        }
    }

    // src/utils/browser-info.ts
    var calcIsDesktopSafari = () => {
        const ua = navigator.userAgent
        return (
            /Macintosh|Windows/.test(ua) &&
            /Version\/[\d.]+.*Safari/.test(ua) &&
            !/Chrome|Chromium|Edg|OPR/.test(ua)
        )
    }
    var calcHtmlMediaCaptureSupport = () => {
        return "capture" in document.createElement("input")
    }
    var calcBrowserInfo = () => ({
        safariDesktop: calcIsDesktopSafari(),
    })
    var calcBrowserFeatures = () => ({
        htmlMediaCapture: calcHtmlMediaCaptureSupport(),
    })
    var browserInfo = calcBrowserInfo()
    calcBrowserFeatures()

    // src/utils/fileTypes.ts
    var BASIC_IMAGE_WILDCARD = "image/*"
    var BASIC_VIDEO_WILDCARD = "video/*"
    var HEIC_IMAGE_MIME_LIST = [
        "image/heif",
        "image/heif-sequence",
        "image/heic",
        "image/heic-sequence",
        "image/avif",
        "image/avif-sequence",
        ".heif",
        ".heifs",
        ".heic",
        ".heics",
        ".avif",
        ".avifs",
    ]
    var calcImageAcceptList = () => {
        if (browserInfo.safariDesktop) {
            return [BASIC_IMAGE_WILDCARD]
        }
        return [BASIC_IMAGE_WILDCARD, ...HEIC_IMAGE_MIME_LIST]
    }
    var IMAGE_ACCEPT_LIST = calcImageAcceptList()
    var mergeFileTypes = (fileTypes) => {
        if (!fileTypes) {
            return []
        }
        return fileTypes
            .filter((item) => typeof item === "string")
            .flatMap((str) => stringToArray(str))
    }
    var matchMimeType = (mimeType, allowedFileTypes) => {
        return allowedFileTypes.some((type) => {
            if (type.endsWith("*")) {
                const normalizedType = type.replace("*", "")
                return mimeType.startsWith(normalizedType)
            }
            return mimeType === type
        })
    }
    var matchExtension = (fileName, allowedFileTypes) => {
        return allowedFileTypes.some((type) => {
            if (!type.startsWith(".")) {
                return false
            }
            return fileName.toLowerCase().endsWith(type.toLowerCase())
        })
    }
    var fileIsImage = (file) => {
        const type = file?.type
        if (!type) {
            return false
        }
        return matchMimeType(type, IMAGE_ACCEPT_LIST)
    }

    // src/abstract/managers/plugin/buildPluginApi.ts
    function buildPluginApi(
        registry,
        ctx,
        sharedInstancesBag,
        pluginId,
        configSubscriptions
    ) {
        const registryApi = {
            registerSource: (source) => registry.addSource(pluginId, source),
            registerActivity: (activity) =>
                registry.addActivity(pluginId, activity),
            registerFileAction: (fileAction) =>
                registry.addFileAction(pluginId, fileAction),
            registerFileHook: (hook) => registry.addFileHook(pluginId, hook),
            registerIcon: (icon) => registry.addIcon(pluginId, icon),
            registerL10n: (l10n) => registry.addL10n(pluginId, l10n),
            registerConfig: (definition) => {
                registry.addConfig(pluginId, definition)
                const stateKey = sharedConfigKey(definition.name)
                if (!ctx.has(stateKey)) {
                    ctx.add(stateKey, definition.defaultValue)
                }
            },
        }
        const configApi = {
            get: (configName) => {
                const stateKey = sharedConfigKey(configName)
                return ctx.read(stateKey)
            },
            subscribe: (configName, callback) => {
                const stateKey = sharedConfigKey(configName)
                const unsub = ctx.sub(stateKey, (value) => {
                    callback(value)
                })
                configSubscriptions.push(unsub)
                return unsub
            },
        }
        const activityApi = {
            getParams: () => {
                return ctx.read("*currentActivityParams")
            },
            subscribeToParams: (callback) => {
                const unsub = ctx.sub("*currentActivityParams", (params) => {
                    callback(params)
                })
                configSubscriptions.push(unsub)
                return unsub
            },
        }
        const filesApi = {
            update: (internalId, changes) => {
                const entry =
                    sharedInstancesBag.uploadCollection?.read(internalId)
                if (!entry) return
                if (changes.file !== void 0) {
                    entry.setValue("file", changes.file)
                    entry.setValue("fileSize", changes.file.size)
                }
                if (changes.cdnUrl !== void 0)
                    entry.setValue("cdnUrl", changes.cdnUrl)
                if (changes.cdnUrlModifiers !== void 0)
                    entry.setValue("cdnUrlModifiers", changes.cdnUrlModifiers)
                if (changes.mimeType !== void 0)
                    entry.setValue("mimeType", changes.mimeType)
            },
        }
        return {
            registry: registryApi,
            config: configApi,
            activity: activityApi,
            files: filesApi,
        }
    }

    // src/abstract/managers/plugin/LazyPluginLoader.ts
    var resolveLazyPlugins = async ({ entries, signal }) => {
        const loadResults = await Promise.all(
            entries.map(async (entry) => {
                if (!entry.isEnabled()) return void 0
                try {
                    const plugin = await entry.load()
                    if (signal.aborted || !entry.isEnabled()) return void 0
                    return plugin ?? void 0
                } catch (error) {
                    if (!signal.aborted) {
                        console.warn(`Failed to load lazy plugin`, error)
                    }
                    return void 0
                }
            })
        )
        return loadResults.filter((p5) => p5 !== void 0)
    }
    var LazyPluginLoader = class {
        constructor(_ctx, _onCompute) {
            this.b = _ctx
            this.Pi = _onCompute
            this.yb = /* @__PURE__ */ new Set()
            this.xf = this.b.sub("*lazyPlugins", (entries) => {
                this.Oi(entries ?? [])
            })
        }
        Oi(entries) {
            for (const unsub of this.yb) unsub()
            this.yb.clear()
            if (entries.length === 0) return
            const deps = /* @__PURE__ */ new Set([sharedConfigKey("plugins")])
            for (const entry of entries) {
                for (const dep of entry.configDeps) {
                    deps.add(sharedConfigKey(dep))
                }
            }
            const recompute = () => this.yf(entries)
            for (const dep of deps) {
                this.yb.add(this.b.sub(dep, recompute, false))
            }
            this.yf(entries)
        }
        yf(entries) {
            this.zd?.abort()
            const controller = new AbortController()
            this.zd = controller
            const get = (key) => this.b.read(sharedConfigKey(key))
            const userPlugins = get("plugins")
            const pluginsPromise = resolveLazyPlugins({
                entries: entries.map((entry) => ({
                    isEnabled: () => entry.isEnabled(get),
                    load: entry.load,
                })),
                signal: controller.signal,
            }).then((lazyPlugins) => {
                if (controller.signal.aborted) return void 0
                return [...userPlugins, ...lazyPlugins]
            })
            this.Pi(pluginsPromise)
        }
        destroy() {
            this.xf()
            for (const unsub of this.yb) unsub()
            this.yb.clear()
            this.zd?.abort()
        }
    }

    // src/abstract/customConfigOptions.ts
    var CustomConfigRegistry = class {
        constructor() {
            // biome-ignore lint/suspicious/noExplicitAny: Custom config values can be of any type
            this.Na = /* @__PURE__ */ new Map()
        }
        register(pluginId, definition) {
            if (this.Na.has(definition.name)) {
                console.warn(
                    `[CustomConfig] Config option "${definition.name}" is already registered`
                )
                return
            }
            const ownedDefinition = {
                attribute: true,
                ...definition,
                pluginId,
            }
            this.Na.set(definition.name, ownedDefinition)
        }
        unregister(name) {
            this.Na.delete(name)
        }
        unregisterByPlugin(pluginId) {
            for (const [name, definition] of this.Na) {
                if (definition.pluginId === pluginId) {
                    this.Na.delete(name)
                }
            }
        }
        // biome-ignore lint/suspicious/noExplicitAny: Custom config values can be of any type
        get(name) {
            return this.Na.get(name)
        }
        // biome-ignore lint/suspicious/noExplicitAny: Custom config values can be of any type
        getAll() {
            return new Map(this.Na)
        }
    }

    // src/abstract/managers/plugin/PluginRegistry.ts
    var PluginRegistry = class {
        constructor(onChange = () => {}) {
            this.r = []
            this.ma = []
            this.kc = []
            this.mc = []
            this.nc = []
            this.bb = []
            this.config = new CustomConfigRegistry()
            this.qa = debounce(onChange, 0)
        }
        /** Drop any pending notification (call on teardown). */
        destroy() {
            this.qa.cancel()
        }
        cb(pluginId, item) {
            return { ...item, pluginId }
        }
        addSource(pluginId, item) {
            const existing = this.r.find((s11) => s11.id === item.id)
            if (existing) {
                console.warn(
                    `[Plugin "${pluginId}"] Source with id "${item.id}" is already registered by plugin "${existing.pluginId}". Skipping.`
                )
                return
            }
            this.r.push(this.cb(pluginId, item))
            this.qa()
        }
        addActivity(pluginId, item) {
            const existing = this.ma.find((a6) => a6.id === item.id)
            if (existing) {
                console.warn(
                    `[Plugin "${pluginId}"] Activity with id "${item.id}" is already registered by plugin "${existing.pluginId}". Skipping.`
                )
                return
            }
            this.ma.push(this.cb(pluginId, item))
            this.qa()
        }
        addFileAction(pluginId, item) {
            this.kc.push(this.cb(pluginId, item))
            this.qa()
        }
        addFileHook(pluginId, item) {
            this.mc.push(this.cb(pluginId, { timeout: 3e4, ...item }))
            this.qa()
        }
        addIcon(pluginId, item) {
            this.nc.push(this.cb(pluginId, item))
            this.qa()
        }
        addL10n(pluginId, item) {
            this.bb.push(this.cb(pluginId, item))
            this.qa()
        }
        addConfig(pluginId, definition) {
            this.config.register(pluginId, definition)
            this.qa()
        }
        purge(pluginId) {
            this.r = this.r.filter((item) => item.pluginId !== pluginId)
            this.ma = this.ma.filter((item) => item.pluginId !== pluginId)
            this.kc = this.kc.filter((item) => item.pluginId !== pluginId)
            this.mc = this.mc.filter((item) => item.pluginId !== pluginId)
            this.nc = this.nc.filter((item) => item.pluginId !== pluginId)
            this.bb = this.bb.filter((item) => item.pluginId !== pluginId)
            this.config.unregisterByPlugin(pluginId)
        }
        snapshot() {
            return {
                sources: [...this.r],
                activities: [...this.ma],
                fileActions: [...this.kc],
                fileHooks: [...this.mc],
                icons: [...this.nc],
                l10n: [...this.bb],
            }
        }
    }

    // src/abstract/managers/plugin/PluginManager.ts
    var PluginManager = class extends SharedInstance {
        constructor(sharedInstancesBag) {
            super(sharedInstancesBag)
            this.Oa = /* @__PURE__ */ new Map()
            this.i = /* @__PURE__ */ new Set()
            this.Ad = Promise.resolve()
            this.registry = new PluginRegistry(() => this.oc())
            this.zf = new LazyPluginLoader(this.b, (pluginsPromise) => {
                this.Ad = this.Ad.then(() => pluginsPromise).then((plugins) => {
                    if (plugins) {
                        return this.Qi(plugins)
                    }
                    return
                })
            })
        }
        get configRegistry() {
            return this.registry.config
        }
        pluginsReady() {
            return this.Ad
        }
        onPluginsChange(callback) {
            this.i.add(callback)
            return () => {
                this.i.delete(callback)
            }
        }
        async Qi(plugins) {
            const currentPluginIds = new Set(this.Oa.keys())
            const processedIds = /* @__PURE__ */ new Set()
            for (const plugin of plugins) {
                if (!plugin.id) {
                    console.warn(
                        '[PluginManager] A plugin is missing the required "id" field, skipping'
                    )
                    continue
                }
                if (processedIds.has(plugin.id)) {
                    console.warn(
                        `[PluginManager] Plugin "${plugin.id}" is already in the list, skipping duplicate`
                    )
                    continue
                }
                processedIds.add(plugin.id)
                if (!this.Oa.has(plugin.id)) {
                    try {
                        await this.Ri(plugin)
                    } catch (error) {
                        this.registry.purge(plugin.id)
                        this.oc()
                        console.error(
                            `[PluginManager] Plugin "${plugin.id}" setup() threw an error`,
                            error
                        )
                    }
                }
                currentPluginIds.delete(plugin.id)
            }
            for (const pluginId of currentPluginIds) {
                this.Bd(pluginId)
            }
        }
        async Ri(plugin) {
            if (this.Oa.has(plugin.id)) {
                this.Bd(plugin.id)
            }
            const configSubscriptions = []
            const pluginApi = buildPluginApi(
                this.registry,
                this.b,
                this.a,
                plugin.id,
                configSubscriptions
            )
            const uploaderApi = this.a.api
            let pluginDispose
            try {
                pluginDispose =
                    (await plugin.setup({ pluginApi, uploaderApi })) ?? void 0
            } catch (error) {
                for (const unsub of configSubscriptions) {
                    try {
                        unsub()
                    } catch (e11) {
                        this.v("Failed to unsubscribe config listener", e11)
                    }
                }
                throw error
            }
            this.Oa.set(plugin.id, {
                plugin,
                dispose: pluginDispose,
                configSubscriptions,
            })
            this.oc()
        }
        Bd(pluginId) {
            const registered = this.Oa.get(pluginId)
            if (!registered) return
            this.registry.purge(pluginId)
            for (const unsub of registered.configSubscriptions) {
                try {
                    unsub()
                } catch (error) {
                    this.v("Failed to unsubscribe config listener", error)
                }
            }
            registered.dispose?.()
            this.Oa.delete(pluginId)
            this.oc()
        }
        snapshot() {
            return this.registry.snapshot()
        }
        async runOnAddHooks(entry) {
            const initialFile = entry.getValue("file")
            if (!initialFile) return
            const onAddHooks = this.registry
                .snapshot()
                .fileHooks.filter((h8) => h8.type === "onAdd")
            if (onAddHooks.length === 0) return
            let file = initialFile
            const abortController = new AbortController()
            for (const hook of onAddHooks) {
                if (abortController.signal.aborted) break
                try {
                    const hookPromise = hook.handler({
                        file,
                        signal: abortController.signal,
                    })
                    const timeoutPromise = new Promise((_2, reject) =>
                        setTimeout(
                            () => reject(new Error(`onAdd hook timed out`)),
                            hook.timeout
                        )
                    )
                    ;({ file } = await Promise.race([
                        hookPromise,
                        timeoutPromise,
                    ]))
                } catch (error) {
                    console.warn(
                        `File hook "onAdd" from plugin "${hook.pluginId}" failed`,
                        error
                    )
                }
            }
            if (file !== initialFile) {
                entry.setValue("file", file)
                entry.setValue("fileSize", file.size)
                entry.setValue("mimeType", file.type || null)
                entry.setValue("isImage", fileIsImage(file))
                if (file instanceof File) {
                    entry.setValue("fileName", file.name)
                }
            }
        }
        destroy() {
            for (const pluginId of Array.from(this.Oa.keys())) {
                this.Bd(pluginId)
            }
            this.registry.destroy()
            this.zf.destroy()
            super.destroy()
        }
        oc() {
            for (const callback of this.i) {
                try {
                    callback()
                } catch {}
            }
        }
    }

    // node_modules/@uploadcare/quality-insights/dist/index.js
    function i7(e11) {
        return e11
            .replace(/[A-Z]/g, (r8) => `_${r8.toLowerCase()}`)
            .replace(/__/g, "_")
    }
    function c6(e11) {
        return Array.isArray(e11)
            ? e11.map((r8) =>
                  typeof r8 == "object" && r8 !== null ? c6(r8) : r8
              )
            : typeof e11 != "object" || e11 === null
              ? e11
              : Object.fromEntries(
                    Object.entries(e11).map(([r8, s11]) => {
                        const t7 = i7(r8)
                        return typeof s11 == "object" && s11 !== null
                            ? [t7, c6(s11)]
                            : [t7, s11]
                    })
                )
    }
    function u3(e11) {
        return { ok: true, value: e11 }
    }
    function a4(e11) {
        return { ok: false, error: e11 }
    }
    var l3 = "https://tlm.uploadcare.com/api/"
    var y3 = class {
        constructor(r8 = l3) {
            this.baseUrl = r8
        }
        async base(r8, s11 = {}) {
            const t7 = `${this.baseUrl}${r8}`
            try {
                const n10 = await fetch(t7, s11)
                if (!n10.ok)
                    return a4(
                        new Error(
                            `Got non-200 response from "${t7}". Status: ${n10.status.toString()}`
                        )
                    )
                try {
                    const o14 = await n10.json()
                    return u3(o14)
                } catch (o14) {
                    return a4(
                        new Error(
                            `Error parsing JSON from "${t7}". Error: ${o14}`
                        )
                    )
                }
            } catch (n10) {
                return a4(
                    new Error(`Error fetching data from "${t7}". Error: ${n10}`)
                )
            }
        }
        async post(r8, s11, t7 = {}) {
            return await this.base(r8, {
                ...t7,
                method: "POST",
                body: JSON.stringify(c6(s11)),
                headers: {
                    "Content-Type": "application/json",
                    ...(t7.headers || {}),
                },
            })
        }
        async get(r8, s11 = {}) {
            return await this.base(r8, {
                method: "GET",
                ...s11,
            })
        }
    }
    var p3 = async (e11, r8) => ({ success: true, data: r8 })
    var f4 = async (e11) => p3(void 0, e11)
    var h3 = class extends y3 {
        constructor() {
            super()
        }
        async sendEvent(r8, s11) {
            const t7 = await f4(r8)
            if (!t7.success)
                throw (
                    console.error(
                        "TelemetryAPIService: events: body is invalid",
                        t7.error
                    ),
                    new Error("TelemetryAPIService: events: body is invalid")
                )
            return this.post("v1/events", r8, s11)
        }
    }

    // src/blocks/UploadCtxProvider/EventEmitter.ts
    var DEFAULT_DEBOUNCE_TIMEOUT = 20
    var InternalEventType = Object.freeze({
        INIT_SOLUTION: "init-solution",
        CHANGE_CONFIG: "change-config",
        ACTION_EVENT: "action-event",
        ERROR_EVENT: "error-event",
    })
    var EventType = Object.freeze({
        FILE_ADDED: "file-added",
        FILE_REMOVED: "file-removed",
        FILE_UPLOAD_START: "file-upload-start",
        FILE_UPLOAD_PROGRESS: "file-upload-progress",
        FILE_UPLOAD_SUCCESS: "file-upload-success",
        FILE_UPLOAD_FAILED: "file-upload-failed",
        FILE_URL_CHANGED: "file-url-changed",
        MODAL_OPEN: "modal-open",
        MODAL_CLOSE: "modal-close",
        DONE_CLICK: "done-click",
        UPLOAD_CLICK: "upload-click",
        ACTIVITY_CHANGE: "activity-change",
        COMMON_UPLOAD_START: "common-upload-start",
        COMMON_UPLOAD_PROGRESS: "common-upload-progress",
        COMMON_UPLOAD_SUCCESS: "common-upload-success",
        COMMON_UPLOAD_FAILED: "common-upload-failed",
        CHANGE: "change",
        GROUP_CREATED: "group-created",
    })
    var EventEmitter = class extends SharedInstance {
        constructor() {
            super(...arguments)
            this.zb = /* @__PURE__ */ new Map()
            this.pc = /* @__PURE__ */ new Set()
            this.da = /* @__PURE__ */ new Map()
        }
        bindTarget(target) {
            this.pc.add(target)
            return () => {
                this.pc.delete(target)
            }
        }
        on(type, handler) {
            let listeners = this.da.get(type)
            if (!listeners) {
                listeners = /* @__PURE__ */ new Set()
                this.da.set(type, listeners)
            }
            listeners.add(handler)
            return () => this.da.get(type)?.delete(handler)
        }
        Af(type, payload) {
            for (const target of this.pc) {
                target.dispatchEvent(
                    new CustomEvent(type, {
                        detail: payload,
                    })
                )
            }
            const listeners = this.da.get(type)
            if (listeners) {
                for (const handler of listeners) {
                    handler(payload)
                }
            }
            this.v?.(() => {
                const copyPayload =
                    !!payload && typeof payload === "object"
                        ? { ...payload }
                        : payload
                return [`event "${type}"`, copyPayload]
            })
        }
        emit(type, payload, options = {}) {
            const { debounce: debounce2 } = options
            if (typeof debounce2 !== "number" && !debounce2) {
                this.Af(
                    type,
                    typeof payload === "function" ? payload() : payload
                )
                return
            }
            if (this.zb.has(type)) {
                window.clearTimeout(this.zb.get(type))
            }
            const timeout =
                typeof debounce2 === "number"
                    ? debounce2
                    : DEFAULT_DEBOUNCE_TIMEOUT
            const timeoutId = window.setTimeout(() => {
                try {
                    const data =
                        typeof payload === "function" ? payload() : payload
                    this.Af(type, data)
                    this.zb.delete(type)
                } catch (error) {
                    this.v?.(
                        () => `Error while getting payload for event "${type}"`,
                        error
                    )
                }
            }, timeout)
            this.zb.set(type, timeoutId)
        }
        destroy() {
            for (const timeoutId of this.zb.values()) {
                window.clearTimeout(timeoutId)
            }
            this.pc.clear()
            this.da.clear()
        }
    }

    // package.json
    var version2 = "1.31.2"

    // src/env.ts
    var PACKAGE_NAME = "blocks"
    var PACKAGE_VERSION = version2

    // src/abstract/managers/TelemetryManager.ts
    var TelemetryManager = class extends SharedInstance {
        constructor(sharedInstancesBag) {
            super(sharedInstancesBag)
            this.Si = UID.generateRandomUUID()
            this.db = structuredClone(initialConfig)
            this.Cd = false
            this.Dd = null
            this.ya = false
            this.Bf = new h3()
            this.eb = new Queue(10)
            this.addSub(
                this.b.sub(sharedConfigKey("qualityInsights"), (value) => {
                    this.ya = Boolean(value)
                })
            )
            for (const key of Object.keys(this.db)) {
                this.addSub(
                    this.b.sub(sharedConfigKey(key), (value) => {
                        if (!this.ya) {
                            return
                        }
                        if (this.Cd && this.db[key] !== value) {
                            this.sendEvent({
                                eventType: InternalEventType.CHANGE_CONFIG,
                            })
                        }
                        this.Ti(key, value)
                    })
                )
            }
        }
        Ui(type) {
            if (type === InternalEventType.INIT_SOLUTION && !this.Cd) {
                this.Cd = true
            }
        }
        Ti(key, value) {
            if (this.db[key] === value) {
                return
            }
            this.db[key] = value
        }
        Vi(body) {
            const payload = body.payload ? { ...body.payload } : {}
            if (payload.activity) {
                payload.activity = void 0
            }
            const result = { ...body }
            if (
                body.eventType === InternalEventType.INIT_SOLUTION ||
                body.eventType === InternalEventType.CHANGE_CONFIG
            ) {
                result.config = this.db
            }
            return {
                ...result,
                appVersion: PACKAGE_VERSION,
                appName: PACKAGE_NAME,
                sessionId: this.Si,
                component: this.Wi,
                activity: this.Xi,
                projectPubkey: this.db.pubkey,
                userAgent: navigator.userAgent,
                eventType: result.eventType ?? "",
                eventTimestamp: this.Yi,
                payload: {
                    location: this.Zi,
                    ...payload,
                },
            }
        }
        _i(type) {
            if (
                type &&
                [
                    EventType.CHANGE,
                    EventType.COMMON_UPLOAD_PROGRESS,
                    EventType.FILE_ADDED,
                    EventType.FILE_REMOVED,
                    EventType.FILE_UPLOAD_START,
                    EventType.FILE_UPLOAD_PROGRESS,
                    EventType.FILE_UPLOAD_SUCCESS,
                    EventType.FILE_UPLOAD_FAILED,
                ].includes(type)
            ) {
                return true
            }
            return false
        }
        sendEvent(body) {
            if (!this.ya) {
                return
            }
            const payload = this.Vi({
                eventType: body.eventType,
                payload: body.payload,
                config: body.config,
            })
            this.Ui(body.eventType)
            const hasExcludedEvents = this._i(body.eventType)
            if (hasExcludedEvents) {
                return
            }
            const hasDataSame = this.Dd && this.Cf(this.Dd, payload)
            if (hasDataSame) {
                return
            }
            this.eb.add(async () => {
                this.Dd = payload
                await this.Bf.sendEvent(payload)
            })
        }
        sendEventError(error, context = "unknown") {
            this.sendEvent({
                eventType: InternalEventType.ERROR_EVENT,
                payload: {
                    metadata: {
                        event: "error",
                        text: `Error in ${context}`,
                        error: error.message,
                    },
                },
            })
        }
        /**
         * Method to send telemetry event for Cloud Image Editor.
         */
        sendEventCloudImageEditor(e11, tabId, options = {}) {
            this.sendEvent({
                eventType: InternalEventType.ACTION_EVENT,
                payload: {
                    metadata: {
                        tabId,
                        node: e11.currentTarget?.tagName,
                        event: e11.type,
                        ...options,
                    },
                },
            })
        }
        /**
         * Deeply compares two objects and returns true if they are equal, false otherwise.
         */
        Cf(last, current) {
            if (JSON.stringify(last) === JSON.stringify(current)) return true
            if (
                typeof last !== "object" ||
                typeof current !== "object" ||
                last == null ||
                current == null
            )
                return false
            const lastKeys = Object.keys(last)
            const currentKeys = Object.keys(current)
            if (lastKeys.length !== currentKeys.length) return false
            for (const key of lastKeys) {
                if (!Object.hasOwn(current, key)) return false
                if (!this.Cf(last[key], current[key])) return false
            }
            return true
        }
        get Yi() {
            return Date.now()
        }
        get Wi() {
            if (!this.b.has("*solution")) {
                return null
            }
            const solution = this.b.read("*solution")
            return solution ? solution.toLowerCase() : null
        }
        get Xi() {
            if (!this.b.has("*currentActivity")) {
                return null
            }
            return this.b.read("*currentActivity")
        }
        get Zi() {
            return location.origin
        }
    }

    // src/utils/getLocaleDirection.ts
    var getLocaleDirection = (localeId) => {
        const locale = new Intl.Locale(localeId)
        let direction = "ltr"
        const fromGetter = locale.getTextInfo?.().direction
        if (fromGetter) {
            direction = fromGetter
        } else if (locale.textInfo?.direction) {
            direction = locale.textInfo.direction
        }
        return direction
    }

    // src/utils/template-utils.ts
    var DEFAULT_TRANSFORMER = (value) => value
    var OPEN_TOKEN = "{{"
    var CLOSE_TOKEN = "}}"
    var PLURAL_PREFIX = "plural:"
    function applyTemplateData(template, data = {}, options = {}) {
        const {
            openToken = OPEN_TOKEN,
            closeToken = CLOSE_TOKEN,
            transform = DEFAULT_TRANSFORMER,
        } = options
        for (const key in data) {
            const rawValue = data[key]
            const value = rawValue != null ? rawValue.toString() : void 0
            const replacement =
                typeof value === "string" ? transform(value) : String(value)
            template = template.replaceAll(
                openToken + key + closeToken,
                replacement
            )
        }
        return template
    }
    function getPluralObjects(template) {
        const pluralObjects = []
        let open = template.indexOf(OPEN_TOKEN)
        while (open !== -1) {
            const close = template.indexOf(CLOSE_TOKEN, open)
            if (close === -1) {
                break
            }
            const variable = template.substring(open + 2, close)
            if (variable.startsWith(PLURAL_PREFIX)) {
                const keyValue = template
                    .substring(open + 2, close)
                    .replace(PLURAL_PREFIX, "")
                const key = keyValue.substring(0, keyValue.indexOf("("))
                const count = keyValue.substring(
                    keyValue.indexOf("(") + 1,
                    keyValue.indexOf(")")
                )
                pluralObjects.push({
                    variable,
                    pluralKey: key,
                    countVariable: count,
                })
            }
            open = template.indexOf(OPEN_TOKEN, close)
        }
        return pluralObjects
    }

    // src/utils/WindowHeightTracker.ts
    var WINDOW_HEIGHT_TRACKER_PROPERTY = "--uploadcare-blocks-window-height"
    var WindowHeightTracker = class _WindowHeightTracker {
        static {
            this.clientsRegistry = /* @__PURE__ */ new Set()
        }
        static {
            this.flush = debounce(() => {
                document.documentElement.style.setProperty(
                    WINDOW_HEIGHT_TRACKER_PROPERTY,
                    `${window.innerHeight}px`
                )
            }, 100)
        }
        static registerClient(client) {
            if (_WindowHeightTracker.clientsRegistry.size === 0) {
                _WindowHeightTracker.attachTracker()
            }
            _WindowHeightTracker.clientsRegistry.add(client)
        }
        static unregisterClient(client) {
            _WindowHeightTracker.clientsRegistry.delete(client)
            if (_WindowHeightTracker.clientsRegistry.size === 0) {
                _WindowHeightTracker.detachTracker()
            }
        }
        static attachTracker() {
            window.addEventListener("resize", _WindowHeightTracker.flush, {
                passive: true,
                capture: true,
            })
            _WindowHeightTracker.flush()
        }
        static detachTracker() {
            window.removeEventListener("resize", _WindowHeightTracker.flush, {
                capture: true,
            })
            document.documentElement.style.removeProperty(
                WINDOW_HEIGHT_TRACKER_PROPERTY
            )
        }
    }

    // src/utils/getPluralForm.ts
    var getPluralForm = (locale, count) => {
        const pluralForm = new Intl.PluralRules(locale).select(count)
        return pluralForm
    }

    // src/lit/l10n.ts
    var createPluralizer = (getL10n) => {
        return (key, count) => {
            const l10n = getL10n()
            const locale = l10n("locale-id") || "en"
            const pluralForm = getPluralForm(locale, count)
            return l10n(`${key}__${pluralForm}`)
        }
    }
    var createL10n = (getCtx) => {
        const pluralizer = createPluralizer(() => l10n)
        const l10n = (str, variables = {}) => {
            if (!str) {
                return ""
            }
            const ctx = getCtx()
            const template = ctx.read(localeStateKey(str)) || str
            const pluralObjects = getPluralObjects(template)
            for (const pluralObject of pluralObjects) {
                variables[pluralObject.variable] = pluralizer(
                    pluralObject.pluralKey,
                    Number(variables[pluralObject.countVariable])
                )
            }
            const result = applyTemplateData(template, variables)
            return result
        }
        return l10n
    }

    // src/lit/TestModeController.ts
    var isCustomElement = (el) => {
        return el.tagName?.includes("-") ?? false
    }
    var TestModeController = class {
        constructor(host) {
            this.Pa = /* @__PURE__ */ new Set()
            this.qc = /* @__PURE__ */ new Map()
            this.Df = false
            this.Qa = host
            this.Qa.addController(this)
        }
        hostDisconnected() {
            this.rc?.()
            this.rc = void 0
            this.Pa.clear()
            this.qc.clear()
        }
        hostUpdated() {
            if (!this.rc && this.Qa.has(sharedConfigKey("testMode"))) {
                const unsubscribe = this.Qa.subConfigValue(
                    "testMode",
                    (isEnabled) => {
                        this.Df = Boolean(isEnabled)
                        this.Ef()
                    }
                )
                this.rc = unsubscribe
            }
            this.$i()
            this.Ef()
        }
        $i() {
            const litHost = this.Qa
            const root = litHost.renderRoot ?? litHost
            if (!root) {
                return
            }
            const hostElement = this.Qa
            const hostTag = hostElement.tagName?.toLowerCase()
            const candidates = Array.from(
                root.querySelectorAll("[data-testid]")
            ).filter((el) => !isCustomElement(el))
            for (const el of candidates) {
                if (hostTag && el.closest(hostTag) !== hostElement) {
                    continue
                }
                if (!this.Pa.has(el)) {
                    const attrValue = el.getAttribute("data-testid")
                    if (!attrValue) {
                        continue
                    }
                    this.Pa.add(el)
                    this.qc.set(el, attrValue)
                }
            }
            for (const el of Array.from(this.Pa)) {
                if (
                    !el.isConnected ||
                    (hostTag && el.closest(hostTag) !== hostElement)
                ) {
                    this.Pa.delete(el)
                    this.qc.delete(el)
                }
            }
        }
        Ef() {
            if (!this.Pa.size) {
                return
            }
            const prefix = this.Qa.testId || ""
            for (const el of this.Pa) {
                const baseValue = this.qc.get(el)
                if (!baseValue) {
                    continue
                }
                if (this.Df) {
                    el.setAttribute("data-testid", `${prefix}--${baseValue}`)
                } else {
                    el.removeAttribute("data-testid")
                }
            }
        }
    }

    // src/lit/LitBlock.ts
    var LitBlockBase = RegisterableElementMixin(
        SymbioteMixin()(CssDataMixin(LightDomMixin(i4)))
    )
    var LitBlock = class extends LitBlockBase {
        constructor() {
            super()
            this.init$ = blockCtx()
            this.l10n = createL10n(() => this.sharedCtx)
            this.debugPrint = createDebugPrinter(
                () => this.sharedCtx,
                this.constructor.name
            )
            this.a = createSharedInstancesBag(() => this.sharedCtx)
            new TestModeController(this)
        }
        static {
            this.styleAttrs = []
        }
        emit(type, payload, options) {
            const eventEmitter = this.has("*eventEmitter")
                ? this.$["*eventEmitter"]
                : void 0
            if (!eventEmitter) {
                return
            }
            eventEmitter.emit(type, payload, options)
            const resolvedPayload =
                typeof payload === "function" ? payload() : payload
            this.telemetryManager.sendEvent({
                eventType: type,
                payload: resolvedPayload ?? void 0,
            })
        }
        hasBlockInCtx(callback) {
            for (const block of this.blocksRegistry) {
                if (callback(block)) {
                    return true
                }
            }
            return false
        }
        connectedCallback() {
            const styleAttrs = this.constructor.styleAttrs
            styleAttrs.forEach((attr) => {
                this.setAttribute(attr, "")
            })
            super.connectedCallback()
            WindowHeightTracker.registerClient(this)
        }
        initCallback() {
            this.S("*blocksRegistry", () => /* @__PURE__ */ new Set())
            this.S(
                "*pluginManager",
                (sharedInstancesBag) => new PluginManager(sharedInstancesBag)
            )
            this.S(
                "*eventEmitter",
                (sharedInstancesBag) => new EventEmitter(sharedInstancesBag)
            )
            this.S(
                "*localeManager",
                (sharedInstancesBag) => new LocaleManager(sharedInstancesBag)
            )
            this.S(
                "*modalManager",
                (sharedInstancesBag) => new ModalManager(sharedInstancesBag)
            )
            this.S("*a11y", () => new A11y())
            this.S(
                "*routerLayer",
                (sharedInstancesBag) => new RouterHooksLayer(sharedInstancesBag)
            )
            this.S(
                "*clipboard",
                (sharedInstancesBag) => new ClipboardLayer(sharedInstancesBag)
            )
            this.S(
                "*telemetryManager",
                (sharedInstancesBag) => new TelemetryManager(sharedInstancesBag)
            )
            this.sub(localeStateKey("locale-id"), (localeId) => {
                const direction = getLocaleDirection(localeId)
                this.style.direction = direction === "ltr" ? "" : direction
                this.requestUpdate()
            })
            this.subConfigValue("testMode", (testMode) => {
                if (!testMode || !this.testId) {
                    this.removeAttribute("data-testid")
                    return
                }
                this.setAttribute("data-testid", this.testId)
            })
            this.blocksRegistry.add(this)
        }
        get testId() {
            const testId = window.customElements.getName(this.constructor)
            return testId
        }
        get modalManager() {
            return this.X("*modalManager", false)
        }
        get telemetryManager() {
            return this.X("*telemetryManager")
        }
        get localeManager() {
            return this.X("*localeManager")
        }
        get a11y() {
            return this.X("*a11y")
        }
        get clipboardLayer() {
            return this.X("*clipboard")
        }
        get routerLayer() {
            return this.X("*routerLayer")
        }
        get blocksRegistry() {
            return this.X("*blocksRegistry")
        }
        get eventEmitter() {
            return this.X("*eventEmitter")
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            WindowHeightTracker.unregisterClient(this)
            const blocksRegistry = this.blocksRegistry
            blocksRegistry?.delete(this)
            if (blocksRegistry?.size === 0) {
                setTimeout(() => {
                    if (this.isConnected || blocksRegistry?.size > 0) {
                        return
                    }
                    this.destroyCtxCallback()
                }, 0)
            }
        }
        /**
         * Called when the last block is removed from the context. Note that inheritors must run their callback before that.
         */
        destroyCtxCallback() {
            this.aj()
            PubSub.deleteCtx(this.ctxName)
        }
        Ff() {
            const key = "*sharedContextInstances"
            if (!this.has(key) || !this.$[key]) {
                const map2 = /* @__PURE__ */ new Map()
                this.add(key, map2, true)
            }
            return this.$[key]
        }
        S(key, resolver) {
            const instances = this.Ff()
            if (instances.has(key)) {
                return
            }
            if (!this.has(key) || !this.$[key]) {
                const instance = resolver(this.a)
                this.add(key, instance, true)
                instances.set(key, instance)
                return
            }
        }
        aj() {
            const instances = this.Ff()
            for (const [key, instance] of instances.entries()) {
                instance?.destroy?.()
                this.pub(key, null)
            }
            instances.clear()
        }
        X(key, isRequired = true) {
            if (this.has(key) && !!this.$[key]) {
                return this.$[key]
            }
            if (!isRequired) {
                return this.$[key]
            }
            throw new Error(
                `Unexpected error: context manager for key "${String(key)}" is not available`
            )
        }
        async proxyUrl(url) {
            if (
                this.cfg.secureDeliveryProxy &&
                this.cfg.secureDeliveryProxyUrlResolver
            ) {
                console.warn(
                    "Both secureDeliveryProxy and secureDeliveryProxyUrlResolver are set. The secureDeliveryProxyUrlResolver will be used."
                )
            }
            if (this.cfg.secureDeliveryProxyUrlResolver) {
                try {
                    return await this.cfg.secureDeliveryProxyUrlResolver(url, {
                        uuid: extractUuid(url),
                        cdnUrlModifiers: extractCdnUrlModifiers(url),
                        fileName: extractFilename(url),
                    })
                } catch (err) {
                    console.error(
                        "Failed to resolve secure delivery proxy URL. Falling back to the default URL.",
                        err
                    )
                    this.telemetryManager.sendEventError(
                        err,
                        "secureDeliveryProxyUrlResolver. Failed to resolve secure delivery proxy URL. Falling back to the default URL."
                    )
                    return url
                }
            }
            if (this.cfg.secureDeliveryProxy) {
                return applyTemplateData(
                    this.cfg.secureDeliveryProxy,
                    { previewUrl: url },
                    { transform: (value) => window.encodeURIComponent(value) }
                )
            }
            return url
        }
        get cfg() {
            if (!this.Ka) {
                const proxyTarget = {}
                this.Ka = new Proxy(proxyTarget, {
                    set: (_obj, key, value) => {
                        if (
                            typeof key !== "string" ||
                            !(key in initialConfig)
                        ) {
                            return false
                        }
                        const typedKey = key
                        const sharedKey = sharedConfigKey(typedKey)
                        if (!this.has(sharedKey)) {
                            this.add(sharedKey, initialConfig[typedKey])
                        }
                        this.$[sharedKey] = value
                        return true
                    },
                    get: (_obj, key) => {
                        const sharedKey = sharedConfigKey(key)
                        if (!this.has(sharedKey)) {
                            this.add(sharedKey, initialConfig[key])
                        }
                        return this.$[sharedKey]
                    },
                })
            }
            return this.Ka
        }
        subConfigValue(key, callback) {
            const sharedKey = sharedConfigKey(key)
            if (!this.has(sharedKey)) {
                this.add(sharedKey, initialConfig[key])
            }
            return this.sub(sharedKey, callback)
        }
    }

    // node_modules/lit-html/directive.js
    var t4 = { ATTRIBUTE: 1, CHILD: 2 }
    var e7 =
        (t7) =>
        (...e11) => ({ md: t7, values: e11 })
    var i8 = class {
        constructor(t7) {}
        get W() {
            return this.n.W
        }
        nd(t7, e11, i12) {
            ;((this.sc = t7), (this.n = e11), (this.bj = i12))
        }
        yi(t7, e11) {
            return this.update(t7, e11)
        }
        update(t7, e11) {
            return this.render(...e11)
        }
    }

    // node_modules/lit-html/directives/unsafe-html.js
    var e8 = class extends i8 {
        constructor(i12) {
            if ((super(i12), (this.it = A), i12.type !== t4.CHILD))
                throw Error(
                    this.constructor.directiveName +
                        "() can only be used in child bindings"
                )
        }
        render(r8) {
            if (r8 === A || null == r8)
                return ((this.Gf = void 0), (this.it = r8))
            if (r8 === E) return r8
            if ("string" != typeof r8)
                throw Error(
                    this.constructor.directiveName +
                        "() called with a non-string value"
                )
            if (r8 === this.it) return this.Gf
            this.it = r8
            const s11 = [r8]
            return (
                (s11.raw = s11),
                (this.Gf = {
                    va: this.constructor.resultType,
                    strings: s11,
                    values: [],
                })
            )
        }
    }
    ;((e8.directiveName = "unsafeHTML"), (e8.resultType = 1))

    // node_modules/lit-html/directives/unsafe-svg.js
    var t5 = class extends e8 {}
    ;((t5.directiveName = "unsafeSVG"), (t5.resultType = 2))
    var o8 = e7(t5)

    // src/blocks/themes/uc-basic/svg-sprite.ts
    var svg_sprite_default =
        "<svg width='0' height='0' style='position:absolute'><symbol viewBox='0 0 24 24' id='uc-icon-about' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11.152 14.12v.1h1.523v-.1c.007-.409.053-.752.138-1.028.086-.277.22-.517.405-.72.188-.202.434-.397.735-.586.32-.191.593-.412.82-.66.232-.249.41-.531.533-.847.125-.32.187-.678.187-1.076 0-.579-.137-1.085-.41-1.518a2.717 2.717 0 0 0-1.14-1.018c-.49-.245-1.062-.367-1.715-.367-.597 0-1.142.114-1.636.34-.49.228-.884.564-1.182 1.008-.299.44-.46.98-.485 1.619h1.62c.024-.377.118-.684.282-.922a1.48 1.48 0 0 1 .617-.532c.25-.114.51-.17.784-.17.301 0 .575.063.82.191.248.124.447.302.597.533.149.23.223.504.223.82 0 .263-.05.502-.149.72a1.91 1.91 0 0 1-.405.574 3.48 3.48 0 0 1-.575.453 4.22 4.22 0 0 0-.847.66c-.234.242-.415.558-.543.949-.125.39-.19.916-.197 1.577Zm.053 3.03c.21.206.46.31.75.31.196 0 .374-.049.534-.144a1.1 1.1 0 0 0 .383-.384c.1-.163.15-.343.15-.538a1 1 0 0 0-.32-.746 1.019 1.019 0 0 0-.746-.314c-.291 0-.542.105-.751.314-.21.206-.314.455-.314.746 0 .295.104.547.314.756ZM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12Zm-1.5 0c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-add' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M12.75 21a.75.75 0 0 1-1.5 0v-8.25H3a.75.75 0 0 1 0-1.5h8.25V3a.75.75 0 0 1 1.5 0v8.25H21a.75.75 0 0 1 0 1.5h-8.25V21Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-arrow-down' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11.5 23.03a.75.75 0 0 0 .999 0l9.29-8.276a.75.75 0 0 0-.998-1.12l-8.042 7.164V1.53a.75.75 0 0 0-1.5 0v19.267l-8.04-7.163a.75.75 0 0 0-.998 1.12z'/></symbol><symbol fill='none' viewBox='0 0 24 24' id='uc-icon-arrow-dropdown' xmlns='http://www.w3.org/2000/svg'><path d='M19.248 9.561 12 16.003 4.752 9.561l.996-1.122L12 13.995l6.252-5.556z' fill='currentColor'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-aspect-ratio' xmlns='http://www.w3.org/2000/svg'><path stroke='currentColor' d='M7.395 22.5H2.454v-5.25m14.824 5.25h4.94v-5.25m0-10.5V1.5h-4.94m-9.883 0H2.454v5.25'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-back' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M20.251 12a.75.75 0 0 1-.75.75H6.067l5.72 5.85a.75.75 0 1 1-1.072 1.05L4.136 12.92a1.292 1.292 0 0 1 0-1.842l6.579-6.728a.75.75 0 1 1 1.072 1.048l-5.72 5.851H19.5a.75.75 0 0 1 .75.75Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-badge-error' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M13.6 18.4a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0zM12 4.5A1.5 1.5 0 0 1 13.5 6v7a1.5 1.5 0 0 1-3 0V6A1.5 1.5 0 0 1 12 4.5z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-badge-success' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='m10.5 18.204 7.6-8.183a1.5 1.5 0 0 0-2.2-2.042l-5.4 5.817-2.4-2.586a1.5 1.5 0 1 0-2.2 2.041l4.6 4.953Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-box' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M1.01 4.148a.75.75 0 0 1 .75.75v4.348a4.437 4.437 0 0 1 2.988-1.153c1.734 0 3.23.992 3.978 2.438a4.478 4.478 0 0 1 3.978-2.438c2.49 0 4.488 2.044 4.488 4.543 0 2.5-1.999 4.544-4.488 4.544a4.478 4.478 0 0 1-3.978-2.438 4.478 4.478 0 0 1-3.978 2.438C2.26 17.18.26 15.135.26 12.636V4.898a.75.75 0 0 1 .75-.75Zm.75 8.488c0 1.692 1.348 3.044 2.988 3.044s2.989-1.352 2.989-3.044c0-1.691-1.349-3.043-2.989-3.043S1.76 10.945 1.76 12.636Zm10.944-3.043c-1.64 0-2.988 1.352-2.988 3.043 0 1.692 1.348 3.044 2.988 3.044s2.988-1.352 2.988-3.044c0-1.69-1.348-3.043-2.988-3.043Zm4.328-1.23a.75.75 0 0 1 1.052.128l2.333 2.983 2.333-2.983a.75.75 0 0 1 1.181.924l-2.562 3.277 2.562 3.276a.75.75 0 1 1-1.181.924l-2.333-2.983-2.333 2.983a.75.75 0 1 1-1.181-.924l2.562-3.276-2.562-3.277a.75.75 0 0 1 .129-1.052Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-camera' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M7.65 2.55a.75.75 0 0 1 .6-.3h7.5a.75.75 0 0 1 .6.3l2.025 2.7H21a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V8.25a3 3 0 0 1 3-3h2.625zm.975 1.2L6.6 6.45a.75.75 0 0 1-.6.3H3a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5V8.25a1.5 1.5 0 0 0-1.5-1.5h-3a.75.75 0 0 1-.6-.3l-2.025-2.7zm3.375 6a3.375 3.375 0 1 0 0 6.75 3.375 3.375 0 0 0 0-6.75zm-4.875 3.375a4.875 4.875 0 1 1 9.75 0 4.875 4.875 0 0 1-9.75 0z'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-camera-full' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' clip-rule='evenodd' d='M2 4.667a2 2 0 0 0-2 2V16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.667a2 2 0 0 0-2-2h-2.667l-2-2.667H6.667l-2 2.667H2Zm8 10a3.667 3.667 0 1 0 0-7.334 3.667 3.667 0 0 0 0 7.334Z' fill='currentColor'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-close' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M4.604 4.604a.75.75 0 0 1 1.06 0L12 10.939l6.335-6.335a.75.75 0 1 1 1.061 1.06L13.061 12l6.335 6.335a.75.75 0 1 1-1.06 1.061L12 13.061l-6.335 6.335a.75.75 0 0 1-1.061-1.06L10.939 12 4.604 5.665a.75.75 0 0 1 0-1.061z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-collapse' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M3.116 12a.75.75 0 0 1 .75-.75h16.268a.75.75 0 0 1 0 1.5H3.866a.75.75 0 0 1-.75-.75Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-default' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11.501.392a.75.75 0 0 1 .998 0l6.704 5.972a.75.75 0 0 1-.998 1.12l-5.455-4.86v13.439a.75.75 0 0 1-1.5 0V2.625l-5.454 4.86a.75.75 0 1 1-.998-1.12zM.857 16.73a.75.75 0 0 1 .75.75v4.914h20.786v-4.914a.75.75 0 0 1 1.5 0v5.664a.75.75 0 0 1-.75.75H.857a.75.75 0 0 1-.75-.75v-5.664a.75.75 0 0 1 .75-.75z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-dropbox' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M6.019 1.92a.75.75 0 0 1 .806 0L12 5.219l5.176-3.297a.75.75 0 0 1 .806 0l5.577 3.553a.75.75 0 0 1 0 1.265l-4.574 2.914 4.574 2.914a.75.75 0 0 1 0 1.265l-5.577 3.554a.75.75 0 0 1-.806 0L12 14.089l-5.175 3.297a.75.75 0 0 1-.806 0L.44 13.833a.75.75 0 0 1 0-1.266l4.575-2.914L.44 6.74a.75.75 0 0 1 0-1.265zm.403 8.616L2.24 13.2l4.182 2.664 4.181-2.664zm6.975 2.664 4.182 2.664L21.76 13.2l-4.181-2.664zm2.776-3.547L12 12.311 7.828 9.653 12 6.995zm1.406-.882 4.181-2.664-4.181-2.664-4.182 2.664zm-6.976-2.664L6.422 3.443 2.24 6.107 6.422 8.77zM5.791 18.544a.75.75 0 0 1 1.035-.23l5.175 3.297 5.175-3.297a.75.75 0 1 1 .806 1.265l-5.578 3.554a.75.75 0 0 1-.806 0L6.02 19.579a.75.75 0 0 1-.23-1.035z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-edit-file' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M18.558 2.804a.78.78 0 0 0-.557.235l-.008.007-2.472 2.46 3.847 3.848 2.46-2.473.004-.003a.78.78 0 0 0 0-1.108l-.004-.003-2.712-2.728a.78.78 0 0 0-.558-.235Zm-.248 7.613-3.852-3.852-8.93 8.887-1.516 5.41 5.41-1.515 8.888-8.93Zm-.636-8.934a2.28 2.28 0 0 1 2.512.505l2.702 2.717.002.002a2.278 2.278 0 0 1 0 3.234l-.002.002-12.541 12.602a.75.75 0 0 1-.33.193l-6.884 1.928a.75.75 0 0 1-.925-.924l1.928-6.885a.75.75 0 0 1 .193-.33l12.603-12.54a2.28 2.28 0 0 1 .742-.504Z' clip-rule='evenodd'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-error' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M13 13h-2V7h2m0 10h-2v-2h2M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-evernote' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M9.804 2.27v-.048c.055-.263.313-.562.85-.562h.44c.142 0 .325.014.526.033.066.009.124.023.267.06l.13.032h.002c.319.079.515.275.644.482a1.461 1.461 0 0 1 .16.356l.004.012a.75.75 0 0 0 .603.577l1.191.207a1988.512 1988.512 0 0 0 2.332.402c.512.083 1.1.178 1.665.442.64.3 1.19.795 1.376 1.77.548 2.931.657 5.829.621 8a39.233 39.233 0 0 1-.125 2.602 17.518 17.518 0 0 1-.092.849.735.735 0 0 0-.024.112c-.378 2.705-1.269 3.796-2.04 4.27-.746.457-1.53.451-2.217.447h-.192c-.46 0-1.073-.23-1.581-.635-.518-.412-.763-.87-.763-1.217 0-.45.188-.688.355-.786.161-.095.436-.137.796.087a.75.75 0 1 0 .792-1.274c-.766-.476-1.64-.52-2.345-.108-.7.409-1.098 1.188-1.098 2.08 0 .996.634 1.84 1.329 2.392.704.56 1.638.96 2.515.96l.185.002c.667.009 1.874.025 3.007-.67 1.283-.786 2.314-2.358 2.733-5.276a4.213 4.213 0 0 0 .056-.335c.023-.184.051-.445.079-.772.055-.655.111-1.585.13-2.704.037-2.234-.074-5.239-.647-8.301v-.002c-.294-1.544-1.233-2.391-2.215-2.85-.777-.363-1.623-.496-2.129-.576a8.872 8.872 0 0 1-.25-.041l-.006-.001-1.99-.345-.761-.132a2.93 2.93 0 0 0-.182-.338A2.532 2.532 0 0 0 12.379.329l-.091-.023a3.967 3.967 0 0 0-.493-.103L11.769.2a7.846 7.846 0 0 0-.675-.04h-.44c-.733 0-1.368.284-1.795.742L2.416 7.431c-.468.428-.751 1.071-.751 1.81 0 .02 0 .041.003.062l.003.034c.017.21.038.468.096.796.107.715.275 1.47.391 1.994.029.13.055.245.075.342l.002.008c.258 1.141.641 1.94.978 2.466.168.263.323.456.444.589a2.808 2.808 0 0 0 .192.194c1.536 1.562 3.713 2.196 5.731 2.08.13-.005.35-.032.537-.073a2.627 2.627 0 0 0 .652-.24c.425-.26.75-.661.992-1.046.184-.294.342-.61.473-.915a3.8 3.8 0 0 0 .627.493 5.022 5.022 0 0 0 1.97.709l.023.002.018.003.11.016c.088.014.205.035.325.058l.056.014c.088.022.164.04.235.061a1.736 1.736 0 0 1 .145.048l.03.014c.765.34 1.302 1.09 1.302 1.871a.75.75 0 0 0 1.5 0c0-1.456-.964-2.69-2.18-3.235a3.595 3.595 0 0 0-.679-.217l-.063-.015a10.616 10.616 0 0 0-.606-.105l-.02-.003-.03-.003h-.002a3.542 3.542 0 0 1-1.331-.485c-.471-.298-.788-.692-.828-1.234a.75.75 0 0 0-1.48-.106l-.001.003-.004.017a8.23 8.23 0 0 1-.092.352 9.963 9.963 0 0 1-.298.892c-.132.34-.29.68-.47.966-.174.276-.339.454-.478.549a1.178 1.178 0 0 1-.221.072 1.949 1.949 0 0 1-.241.036h-.013l-.032.002c-1.684.1-3.423-.437-4.604-1.65a.746.746 0 0 0-.053-.05L4.84 14.6a1.348 1.348 0 0 1-.07-.073 2.99 2.99 0 0 1-.293-.392c-.242-.379-.558-1.014-.778-1.985a54.1 54.1 0 0 0-.083-.376 27.494 27.494 0 0 1-.367-1.872l-.003-.02a6.791 6.791 0 0 1-.08-.67c.004-.277.086-.475.2-.609l.067-.067a.63.63 0 0 1 .292-.145h.05c.18 0 1.095.055 2.013.115l1.207.08.534.037a.747.747 0 0 0 .052.002c.782 0 1.349-.206 1.759-.585l.005-.005c.553-.52.622-1.225.622-1.76V6.24l-.026-.565A774.97 774.97 0 0 1 9.885 4.4c-.042-.961-.081-1.939-.081-2.13ZM4.995 6.953a251.126 251.126 0 0 1 2.102.137l.508.035c.48-.004.646-.122.715-.185.07-.068.146-.209.147-.649l-.024-.548a791.69 791.69 0 0 1-.095-2.187L4.995 6.953Zm16.122 9.996Zm-5.479-5.323a.75.75 0 0 0 1.014.31 2.04 2.04 0 0 1 .304-.089 1.84 1.84 0 0 1 .544-.039c.215.023.321.06.37.085.033.016.039.026.047.04a.75.75 0 0 0 1.289-.767c-.337-.567-.906-.783-1.552-.85a3.334 3.334 0 0 0-1.002.062c-.27.056-.531.14-.705.234a.75.75 0 0 0-.31 1.014Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-expand' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='m12 8.337-8.47 8.47a.75.75 0 0 1-1.06-1.06l8.605-8.606a1.29 1.29 0 0 1 1.85 0l8.605 8.605a.75.75 0 1 1-1.06 1.06L12 8.338Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-external-source-placeholder' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M6.341 3.27a10.5 10.5 0 0 1 5.834-1.77.75.75 0 0 0 0-1.5 12 12 0 1 0 12 12 .75.75 0 0 0-1.5 0A10.5 10.5 0 1 1 6.34 3.27Zm14.145 1.48a.75.75 0 1 0-1.06-1.062L9.925 13.19V7.95a.75.75 0 1 0-1.5 0V15c0 .414.336.75.75.75h7.05a.75.75 0 0 0 0-1.5h-5.24l9.501-9.5Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-facebook' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M12 1.5C6.201 1.5 1.5 6.201 1.5 12c0 4.943 3.416 9.089 8.016 10.204v-6.108H7.383a.75.75 0 0 1-.75-.75v-3.281a.75.75 0 0 1 .75-.75h2.133V9.393c0-.958.225-2.511 1.38-3.65 1.194-1.177 3.174-1.718 6.254-1.056a.75.75 0 0 1 .592.733v2.754a.75.75 0 0 1-.75.75c-.692 0-1.203.026-1.584.082-.387.057-.578.137-.675.202-.109.073-.237.205-.237 1.029v1.078h2.39a.75.75 0 0 1 .742.866l-.516 3.281a.75.75 0 0 1-.74.634h-1.876v6.106C19.09 21.082 22.5 16.939 22.5 12c0-5.799-4.701-10.5-10.5-10.5zM0 12C0 5.373 5.373 0 12 0s12 5.373 12 12c0 5.995-4.395 10.961-10.138 11.856a.75.75 0 0 1-.866-.74v-7.77a.75.75 0 0 1 .75-.75h1.984l.28-1.781h-2.264a.75.75 0 0 1-.75-.75v-1.828c0-.829.089-1.729.9-2.274.363-.244.807-.37 1.293-.441a9.623 9.623 0 0 1 1.053-.086V6.04c-2.41-.405-3.645.132-4.293.771-.737.728-.933 1.793-.933 2.582v2.672a.75.75 0 0 1-.75.75H8.133v1.78h2.133a.75.75 0 0 1 .75.75v7.772a.75.75 0 0 1-.865.741C4.4 22.968 0 18 0 12z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-file' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M2.895 1.201c0-.473.383-.857.857-.857h8.4c.227 0 .445.09.606.251l8.4 8.4c.16.16.25.379.25.606v13.2a.857.857 0 0 1-.856.857h-16.8a.857.857 0 0 1-.857-.857zm1.714.857v19.886h15.085V10.458h-7.542a.857.857 0 0 1-.858-.857V2.058zm8.4 1.213 5.473 5.473H13.01z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-flickr' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M5.959 7.926c-2.298 0-4.14 1.834-4.14 4.073 0 2.241 1.842 4.075 4.14 4.075 2.302 0 4.145-1.834 4.145-4.075 0-2.238-1.843-4.073-4.145-4.073Zm-5.64 4.073c0-3.086 2.533-5.573 5.64-5.573 3.11 0 5.645 2.486 5.645 5.573 0 3.089-2.535 5.575-5.645 5.575-3.107 0-5.64-2.487-5.64-5.575Zm18.07-4.073c-2.301 0-4.144 1.835-4.144 4.073 0 2.24 1.843 4.075 4.145 4.075 2.299 0 4.141-1.834 4.141-4.075 0-2.239-1.842-4.073-4.141-4.073Zm-5.644 4.073c0-3.087 2.535-5.573 5.645-5.573 3.108 0 5.641 2.487 5.641 5.573 0 3.088-2.533 5.575-5.641 5.575-3.11 0-5.645-2.486-5.645-5.575Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-gdrive' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M7.736 1.818a.75.75 0 0 1 .647-.37h7.587a.75.75 0 0 1 .655.383l7.233 12.946a.75.75 0 0 1-.003.737l-3.794 6.66a.75.75 0 0 1-.651.378H4.59a.75.75 0 0 1-.651-.378l-3.794-6.66a.75.75 0 0 1 .005-.75zm.64 1.876L1.663 15.148l2.93 5.145 6.655-11.581zm3.736 6.526-2.398 4.173H14.5zm4.116 4.173h5.697L15.53 2.947H9.677zm5.685 1.5H8.852l-2.966 5.16h13.088z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-gphotos' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M12.51 0c-.702 0-1.272.57-1.272 1.273V7.35A6.381 6.381 0 0 0 0 11.489c0 .703.57 1.273 1.273 1.273H7.35A6.381 6.381 0 0 0 11.488 24c.704 0 1.274-.57 1.274-1.273V16.65A6.381 6.381 0 0 0 24 12.51c0-.703-.57-1.273-1.273-1.273H16.65A6.381 6.381 0 0 0 12.511 0Zm.252 11.232V1.53a4.857 4.857 0 0 1 0 9.702Zm-1.53.006H1.53a4.857 4.857 0 0 1 9.702 0Zm1.536 1.524a4.857 4.857 0 0 0 9.702 0h-9.702Zm-6.136 4.857c0-2.598 2.04-4.72 4.606-4.85v9.7a4.857 4.857 0 0 1-4.606-4.85Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-huddle' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M6.204 2.002c-.252.23-.357.486-.357.67V21.07c0 .15.084.505.313.812.208.28.499.477.929.477.519 0 .796-.174.956-.365.178-.212.286-.535.286-.924v-.013l.117-6.58c.004-1.725 1.419-3.883 3.867-3.883 1.33 0 2.332.581 2.987 1.364.637.762.95 1.717.95 2.526v6.47c0 .392.11.751.305.995.175.22.468.41 1.008.41.52 0 .816-.198 1.002-.437.207-.266.31-.633.31-.969V14.04c0-2.81-1.943-5.108-4.136-5.422a5.971 5.971 0 0 0-3.183.41c-.912.393-1.538.96-1.81 1.489a.75.75 0 0 1-1.417-.344v-7.5c0-.587-.47-1.031-1.242-1.031-.315 0-.638.136-.885.36ZM5.194.892A2.844 2.844 0 0 1 7.09.142c1.328 0 2.742.867 2.742 2.53v5.607a6.358 6.358 0 0 1 1.133-.629 7.47 7.47 0 0 1 3.989-.516c3.056.436 5.425 3.482 5.425 6.906v6.914c0 .602-.177 1.313-.627 1.89-.47.605-1.204 1.016-2.186 1.016-.96 0-1.698-.37-2.179-.973-.46-.575-.633-1.294-.633-1.933v-6.469c0-.456-.19-1.071-.602-1.563-.394-.471-.986-.827-1.836-.827-1.447 0-2.367 1.304-2.367 2.39v.014l-.117 6.58c-.001.64-.177 1.333-.637 1.881-.48.57-1.2.9-2.105.9-.995 0-1.7-.5-2.132-1.081-.41-.552-.61-1.217-.61-1.708V2.672c0-.707.366-1.341.847-1.78Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-info' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11 9h2V7h-2m1 13c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8m0-18A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2m-1 15h2v-6h-2v6Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-local' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M3 3.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 21 7.5h-9a.75.75 0 0 1-.643-.364L9.325 3.75zm-3 1.5a3 3 0 0 1 3-3h6.75a.75.75 0 0 1 .643.364L12.425 6H21a3 3 0 0 1 3 3v9.75a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-microphone' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' clip-rule='evenodd' d='M7.5 4.781a4.5 4.5 0 0 1 9 0v6.469a4.5 4.5 0 1 1-9 0V4.781Zm4.5-3a3 3 0 0 0-3 3v6.469a3 3 0 1 0 6 0V4.781a3 3 0 0 0-3-3Zm-8.156 8.11a.75.75 0 0 1 .75.75 7.406 7.406 0 1 0 14.812 0 .75.75 0 0 1 1.5 0 8.907 8.907 0 0 1-8.156 8.875v2.703h3.258a.75.75 0 1 1 0 1.5H7.992a.75.75 0 0 1 0-1.5h3.258v-2.703a8.907 8.907 0 0 1-8.156-8.875.75.75 0 0 1 .75-.75Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-microphone-mute' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' clip-rule='evenodd' d='M7.5 4.781a4.5 4.5 0 0 1 9 0V6l3.524-3.524a.75.75 0 1 1 1.061 1.06L5.036 19.585a.75.75 0 0 1-1.06-1.06l1.656-1.657a8.88 8.88 0 0 1-2.538-6.227.75.75 0 0 1 1.5 0c0 2.009.8 3.83 2.1 5.166l1.771-1.772A4.483 4.483 0 0 1 7.5 11.25V4.781Zm2.037 8.182L15 7.5V4.781a3 3 0 1 0-6 0v6.469c0 .637.198 1.227.537 1.713Zm10.62-3.072a.75.75 0 0 1 .75.75 8.907 8.907 0 0 1-8.157 8.875v2.703h3.258a.75.75 0 1 1 0 1.5H7.992a.75.75 0 0 1 0-1.5h3.258v-2.703a8.855 8.855 0 0 1-3.035-.811.75.75 0 1 1 .638-1.358 7.406 7.406 0 0 0 10.553-6.707.75.75 0 0 1 .75-.75ZM15 10.81a.75.75 0 0 1 1.5 0v.439a4.5 4.5 0 0 1-5 4.473.75.75 0 1 1 .166-1.491A3 3 0 0 0 15 11.25v-.44Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-mobile-photo-camera' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M7.65 2.55a.75.75 0 0 1 .6-.3h7.5a.75.75 0 0 1 .6.3l2.025 2.7H21a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V8.25a3 3 0 0 1 3-3h2.625zm.975 1.2L6.6 6.45a.75.75 0 0 1-.6.3H3a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h18a1.5 1.5 0 0 0 1.5-1.5V8.25a1.5 1.5 0 0 0-1.5-1.5h-3a.75.75 0 0 1-.6-.3l-2.025-2.7zm3.375 6a3.375 3.375 0 1 0 0 6.75 3.375 3.375 0 0 0 0-6.75zm-4.875 3.375a4.875 4.875 0 1 1 9.75 0 4.875 4.875 0 0 1-9.75 0z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-mobile-video-camera' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' clip-rule='evenodd' d='M0 6.75a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v1.078L22.873 5A.75.75 0 0 1 24 5.648v12.704a.75.75 0 0 1-1.123.65L18 16.207v1.043a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6.75Zm18 7.728 4.5 2.58V6.95L18 9.562v4.916ZM16.5 6.75a1.5 1.5 0 0 0-1.5-1.5H3a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V6.75Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-ngdrive' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M7.736 1.818a.75.75 0 0 1 .647-.37h7.587a.75.75 0 0 1 .655.383l7.233 12.946a.75.75 0 0 1-.003.737l-3.794 6.66a.75.75 0 0 1-.651.378H4.59a.75.75 0 0 1-.651-.378l-3.794-6.66a.75.75 0 0 1 .005-.75zm.64 1.876L1.663 15.148l2.93 5.145 6.655-11.581zm3.736 6.526-2.398 4.173H14.5zm4.116 4.173h5.697L15.53 2.947H9.677zm5.685 1.5H8.852l-2.966 5.16h13.088z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-onedrive' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M13.616 4.147a7.689 7.689 0 0 0-7.642 3.285A6.299 6.299 0 0 0 1.455 17.3c.684.894 2.473 2.658 5.17 2.658h12.141c.95 0 1.882-.256 2.697-.743.815-.486 1.514-1.247 1.964-2.083a5.26 5.26 0 0 0-3.713-7.612 7.69 7.69 0 0 0-6.098-5.373ZM3.34 17.15c.674.63 1.761 1.308 3.284 1.308h12.142a3.76 3.76 0 0 0 2.915-1.383l-7.494-4.489L3.34 17.15Zm10.875-6.25 2.47-1.038a5.239 5.239 0 0 1 1.427-.389 6.19 6.19 0 0 0-10.3-1.952 6.338 6.338 0 0 1 2.118.813l4.285 2.567Zm4.55.033c-.512 0-1.019.104-1.489.307l-.006.003-1.414.594 6.521 3.906a3.76 3.76 0 0 0-3.357-4.8l-.254-.01ZM4.097 9.617A4.799 4.799 0 0 1 6.558 8.9c.9 0 1.84.25 2.587.713l3.4 2.037-10.17 4.28a4.799 4.799 0 0 1 1.721-6.312Z'/></symbol><symbol fill='none' viewBox='0 0 16 16' id='uc-icon-paperclip' xmlns='http://www.w3.org/2000/svg'><path stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' d='M13.264 9.743 9.03 13.977a4.217 4.217 0 0 1-5.96-.005 4.217 4.217 0 0 1-.004-5.96l6.416-6.416a2.743 2.743 0 0 1 3.88 3.88L7.637 11.2a1.232 1.232 0 1 1-1.743-1.743L9.42 5.932'/></symbol><symbol fill='none' viewBox='0 0 10 10' id='uc-icon-pause' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' d='M1 0h2.5v10H1zM6.5 0H9v10H6.5z'/></symbol><symbol fill='none' viewBox='0 0 10 10' id='uc-icon-play' xmlns='http://www.w3.org/2000/svg'><path d='m1 0 9 5-9 5V0Z' fill='currentColor'/></symbol><symbol fill='none' viewBox='0 0 24 24' id='uc-icon-preloader' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='12' r='11' stroke='currentColor' stroke-linecap='round' style='stroke-dasharray:100 100;stroke-dashoffset:var(--l-progress-offset, 100);transition:stroke-dashoffset .6s linear' transform='rotate(-90 12 12)'/><circle cx='12' cy='12' r='11' stroke='currentColor' stroke-linecap='round' opacity='.2'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-remove-file' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11.955 3.3A2.969 2.969 0 0 0 8.998 6h5.914a2.97 2.97 0 0 0-2.957-2.7zM16.416 6a4.47 4.47 0 0 0-8.922 0h-2.32a.755.755 0 0 0-.111.008H3.075a.75.75 0 1 0 0 1.5h1.35V19.35a2.85 2.85 0 0 0 2.85 2.85h9.45a2.85 2.85 0 0 0 2.85-2.85V7.508h1.35a.75.75 0 0 0 0-1.5h-1.989A.754.754 0 0 0 18.825 6zM5.925 7.508V19.35a1.35 1.35 0 0 0 1.35 1.35h9.45a1.35 1.35 0 0 0 1.35-1.35V7.508z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-select' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='m7 10 5 5 5-5H7Z'/></symbol><symbol fill='none' viewBox='0 0 20 20' id='uc-icon-square' xmlns='http://www.w3.org/2000/svg'><rect width='20' height='20' rx='4' fill='#fff'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-upload' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M11.501.392a.75.75 0 0 1 .998 0l6.704 5.972a.75.75 0 0 1-.998 1.12l-5.455-4.86v13.439a.75.75 0 0 1-1.5 0V2.625l-5.454 4.86a.75.75 0 1 1-.998-1.12zM.857 16.73a.75.75 0 0 1 .75.75v4.914h20.786v-4.914a.75.75 0 0 1 1.5 0v5.664a.75.75 0 0 1-.75.75H.857a.75.75 0 0 1-.75-.75v-5.664a.75.75 0 0 1 .75-.75z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-upload-error' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M13 13h-2V7h2m0 10h-2v-2h2M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2Z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-url' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M19.11 3.67c-1.71-1.709-4.578-1.682-6.408.148l-2.22 2.22a.75.75 0 0 1-1.062-1.06l2.222-2.221C14.018.381 17.836.276 20.17 2.61l1.22 1.22c2.335 2.334 2.23 6.153-.147 8.529l-2.22 2.22a.75.75 0 0 1-1.062-1.06l2.222-2.221c1.83-1.83 1.856-4.698.147-6.408zm-3.36 4.58a.75.75 0 0 1 0 1.06l-6.439 6.44a.75.75 0 0 1-1.06-1.06l6.439-6.44a.75.75 0 0 1 1.06 0zM6.04 9.42a.75.75 0 0 1 0 1.061l-2.222 2.222c-1.83 1.83-1.856 4.698-.147 6.407l1.22 1.22c1.71 1.71 4.578 1.683 6.408-.147l2.221-2.221a.75.75 0 1 1 1.06 1.06l-2.22 2.222c-2.377 2.376-6.195 2.481-8.53.147l-1.22-1.22c-2.334-2.334-2.228-6.153.148-8.53l2.221-2.22a.75.75 0 0 1 1.06 0z'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-video-camera' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' clip-rule='evenodd' d='M0 6.75a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v1.078L22.873 5A.75.75 0 0 1 24 5.648v12.704a.75.75 0 0 1-1.123.65L18 16.207v1.043a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V6.75Zm18 7.728 4.5 2.58V6.95L18 9.562v4.916ZM16.5 6.75a1.5 1.5 0 0 0-1.5-1.5H3a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V6.75Z'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-video-camera-full' xmlns='http://www.w3.org/2000/svg'><path d='M2 3.333a2 2 0 0 0-2 2v9.334a2 2 0 0 0 2 2h10.938a2 2 0 0 0 2-2v-2.013L20 15.646V4.354l-5.063 3.03v-2.05a2 2 0 0 0-2-2H2Z' fill='currentColor'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-vk' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M6.341 3.27a10.5 10.5 0 0 1 5.834-1.77.75.75 0 0 0 0-1.5 12 12 0 1 0 12 12 .75.75 0 0 0-1.5 0A10.5 10.5 0 1 1 6.34 3.27Zm14.145 1.48a.75.75 0 1 0-1.06-1.062L9.925 13.19V7.95a.75.75 0 1 0-1.5 0V15c0 .414.336.75.75.75h7.05a.75.75 0 0 0 0-1.5h-5.24l9.501-9.5Z'/></symbol></svg>"

    // src/lit/LitSolutionBlock.ts
    var LitSolutionBlock = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.init$ = solutionBlockCtx(this)
        }
        static {
            this.styleAttrs = ["uc-wgt-common"]
        }
        static {
            this.lazyPlugins = null
        }
        initCallback() {
            super.initCallback()
            this.a11y?.registerBlock(this)
            this.clipboardLayer?.registerBlock(this)
            this.sharedCtx.pub("*solution", this.tagName)
            const entries = this.constructor.lazyPlugins
            if (entries) {
                this.sharedCtx.pub("*lazyPlugins", entries)
            }
        }
        render() {
            return b2`${o8(svg_sprite_default)}`
        }
    }

    // src/utils/isSecureTokenExpired.ts
    var msToUnixTimestamp = (ms) => {
        if (typeof ms !== "number") {
            return 0
        }
        return Math.floor(ms / 1e3)
    }
    var isSecureTokenExpired = (secureToken, { threshold }) => {
        const { secureExpire } = secureToken
        const nowUnix = msToUnixTimestamp(Date.now())
        const expireUnix = Number(secureExpire)
        const thresholdUnix = msToUnixTimestamp(threshold)
        return nowUnix + thresholdUnix >= expireUnix
    }

    // src/abstract/managers/SecureUploadsManager.ts
    var SecureUploadsManager = class extends SharedInstance {
        constructor() {
            super(...arguments)
            this.Ra = null
        }
        async getSecureToken() {
            const {
                secureSignature,
                secureExpire,
                secureUploadsSignatureResolver,
                secureUploadsExpireThreshold,
            } = this.La
            if (
                (secureSignature || secureExpire) &&
                secureUploadsSignatureResolver
            ) {
                console.warn(
                    "Both secureSignature/secureExpire and secureUploadsSignatureResolver are set. secureUploadsSignatureResolver will be used."
                )
            }
            if (secureUploadsSignatureResolver) {
                if (
                    !this.Ra ||
                    isSecureTokenExpired(this.Ra, {
                        threshold: secureUploadsExpireThreshold,
                    })
                ) {
                    if (!this.Ra) {
                        this.v("Secure signature is not set yet.")
                    } else {
                        this.v(
                            "Secure signature is expired. Resolving a new one..."
                        )
                    }
                    try {
                        const result = await secureUploadsSignatureResolver()
                        if (!result) {
                            this.v(
                                "Secure signature resolver returned nothing."
                            )
                            this.Ra = null
                        } else if (
                            !result.secureSignature ||
                            !result.secureExpire
                        ) {
                            console.error(
                                "Secure signature resolver returned an invalid result:",
                                result
                            )
                        } else {
                            this.v("Secure signature resolved:", result)
                            this.v(
                                "Secure signature will expire in",
                                new Date(
                                    Number(result.secureExpire) * 1e3
                                ).toISOString()
                            )
                            this.Ra = result
                        }
                    } catch (err) {
                        console.error(
                            "Secure signature resolving failed. Falling back to the previous one.",
                            err
                        )
                        this.a.telemetryManager.sendEventError(
                            err,
                            "secureUploadsSignatureResolver. Secure signature resolving failed. Falling back to the previous one."
                        )
                    }
                }
                return this.Ra
            }
            if (secureSignature && secureExpire) {
                this.v("Secure signature and expire are set. Using them...", {
                    secureSignature,
                    secureExpire,
                })
                return {
                    secureSignature,
                    secureExpire,
                }
            }
            return null
        }
        destroy() {
            super.destroy()
            this.Ra = null
        }
    }

    // src/utils/validators/collection/validateCollectionUploadError.ts
    var validateCollectionUploadError = (collection, api) => {
        if (collection.failedCount > 0) {
            return {
                type: "SOME_FILES_HAS_ERRORS",
                message: api.l10n("some-files-were-not-uploaded"),
            }
        }
        return void 0
    }

    // src/utils/validators/collection/validateMultiple.ts
    var validateMultiple = (collection, api) => {
        const total = collection.totalCount
        const multipleMin = api.cfg.multiple ? api.cfg.multipleMin : 0
        const multipleMax = api.cfg.multiple ? api.cfg.multipleMax : 1
        if (multipleMin && total < multipleMin) {
            const message = api.l10n("files-count-limit-error-too-few", {
                min: multipleMin,
                max: multipleMax,
                total,
            })
            return {
                type: "TOO_FEW_FILES",
                message,
                payload: {
                    total,
                    min: multipleMin,
                    max: multipleMax,
                },
            }
        }
        if (multipleMax && total > multipleMax) {
            const message = api.l10n("files-count-limit-error-too-many", {
                min: multipleMin,
                max: multipleMax,
                total,
            })
            return {
                type: "TOO_MANY_FILES",
                message,
                payload: {
                    total,
                    min: multipleMin,
                    max: multipleMax,
                },
            }
        }
        return void 0
    }

    // src/utils/validators/file/validateFileType.ts
    var validateFileType = (outputEntry, api) => {
        const imagesOnly = api.cfg.imgOnly
        const accept = api.cfg.accept
        const allowedFileTypes = mergeFileTypes([
            ...(imagesOnly ? IMAGE_ACCEPT_LIST : []),
            accept,
        ])
        if (!allowedFileTypes.length) return
        const mimeType = outputEntry.mimeType
        const fileName = outputEntry.name
        if (!mimeType || !fileName) {
            return
        }
        const mimeOk = matchMimeType(mimeType, allowedFileTypes)
        const extOk = matchExtension(fileName, allowedFileTypes)
        if (!mimeOk && !extOk) {
            return {
                type: "FORBIDDEN_FILE_TYPE",
                message: api.l10n("file-type-not-allowed"),
                payload: { entry: outputEntry },
            }
        }
        return void 0
    }

    // src/utils/validators/file/validateIsImage.ts
    var validateIsImage = (outputEntry, api) => {
        const imagesOnly = api.cfg.imgOnly
        const isImage = outputEntry.isImage
        if (!imagesOnly || isImage) {
            return
        }
        if (!outputEntry.fileInfo && outputEntry.externalUrl) {
            return
        }
        if (!outputEntry.fileInfo && !outputEntry.mimeType) {
            return
        }
        return {
            type: "NOT_AN_IMAGE",
            message: api.l10n("images-only-accepted"),
            payload: { entry: outputEntry },
        }
    }

    // src/utils/prettyBytes.ts
    var BASE = 1e3
    var ByteUnitEnum = Object.freeze({
        AUTO: "auto",
        BYTE: "byte",
        KB: "kb",
        MB: "mb",
        GB: "gb",
        TB: "tb",
        PB: "pb",
    })
    var round = (number) => Math.ceil(number * 100) / 100
    var prettyBytes = (bytes, unit = ByteUnitEnum.AUTO) => {
        const isAutoMode = unit === ByteUnitEnum.AUTO
        if (unit === ByteUnitEnum.BYTE || (isAutoMode && bytes < BASE ** 1)) {
            const pluralForm = getPluralForm("en-US", bytes)
            const pluralized = pluralForm === "one" ? "byte" : "bytes"
            return `${bytes} ${pluralized}`
        }
        if (unit === ByteUnitEnum.KB || (isAutoMode && bytes < BASE ** 2)) {
            return `${round(bytes / BASE ** 1)} KB`
        }
        if (unit === ByteUnitEnum.MB || (isAutoMode && bytes < BASE ** 3)) {
            return `${round(bytes / BASE ** 2)} MB`
        }
        if (unit === ByteUnitEnum.GB || (isAutoMode && bytes < BASE ** 4)) {
            return `${round(bytes / BASE ** 3)} GB`
        }
        if (unit === ByteUnitEnum.TB || (isAutoMode && bytes < BASE ** 5)) {
            return `${round(bytes / BASE ** 4)} TB`
        }
        return `${round(bytes / BASE ** 5)} PB`
    }

    // src/utils/validators/file/validateMaxSizeLimit.ts
    var validateMaxSizeLimit = (outputEntry, api) => {
        const maxFileSize = api.cfg.maxLocalFileSizeBytes
        const fileSize = outputEntry.size
        if (maxFileSize && fileSize && fileSize > maxFileSize) {
            return {
                type: "FILE_SIZE_EXCEEDED",
                message: api.l10n("files-max-size-limit-error", {
                    maxFileSize: prettyBytes(maxFileSize),
                }),
                payload: { entry: outputEntry },
            }
        }
        return void 0
    }

    // src/utils/validators/file/validateUploadError.ts
    var validateUploadError = (outputEntry, api) => {
        const { internalId } = outputEntry
        if (!api.m.hasItem(internalId)) {
            return
        }
        const internalEntry = api.m.read(internalId)
        const cause = internalEntry?.getValue("uploadError")
        if (!cause) {
            return
        }
        if (cause instanceof UploadError) {
            return {
                type: "UPLOAD_ERROR",
                message: cause.message,
                payload: {
                    entry: outputEntry,
                    error: cause,
                },
            }
        }
        if (cause instanceof NetworkError) {
            return {
                type: "NETWORK_ERROR",
                message: cause.message,
                payload: {
                    entry: outputEntry,
                    error: cause,
                },
            }
        }
        const error =
            cause instanceof Error
                ? cause
                : new Error("Unknown error", { cause })
        return {
            type: "UNKNOWN_ERROR",
            message: error.message,
            payload: {
                entry: outputEntry,
                error,
            },
        }
    }

    // src/abstract/managers/ValidationManager.ts
    var LOG_TEXT = {
        FILE_VALIDATION_FAILED: "File validator execution has failed",
        FILE_VALIDATION_TIMEOUT: "File validator execution has timed out",
        COLLECTION_VALIDATION_FAILED:
            "Collection validator execution has failed",
        MISSING_ERROR_MESSAGE:
            "Missing message. We recommend adding message: value.",
    }
    var getValidatorDescriptor = (validator) => {
        if (typeof validator === "function") {
            return { runOn: "change", validator }
        }
        return validator
    }
    var ValidationManager = class extends SharedInstance {
        constructor(sharedInstancesBag) {
            super(sharedInstancesBag)
            this.cj = [
                validateIsImage,
                validateFileType,
                validateMaxSizeLimit,
                validateUploadError,
            ]
            this.dj = [validateMultiple, validateCollectionUploadError]
            this.eb = new Queue(20)
            this.Hf = debounce(() => {
                this.eb.run()
            }, 500)
            this.za = false
            this.fb = /* @__PURE__ */ new Map()
            const runAllValidators = debounce(() => {
                this.runFileValidators("change")
                this.runCollectionValidators()
            }, 0)
            this.addSub(
                this.b.sub(
                    sharedConfigKey("maxLocalFileSizeBytes"),
                    runAllValidators
                )
            )
            this.addSub(
                this.b.sub(sharedConfigKey("multipleMin"), runAllValidators)
            )
            this.addSub(
                this.b.sub(sharedConfigKey("multipleMax"), runAllValidators)
            )
            this.addSub(
                this.b.sub(sharedConfigKey("multiple"), runAllValidators)
            )
            this.addSub(
                this.b.sub(sharedConfigKey("imgOnly"), runAllValidators)
            )
            this.addSub(this.b.sub(sharedConfigKey("accept"), runAllValidators))
            this.addSub(
                this.b.sub(
                    sharedConfigKey("validationConcurrency"),
                    (concurrency) => {
                        this.eb.concurrency = concurrency
                    }
                )
            )
        }
        get m() {
            return this.a.uploadCollection
        }
        runFileValidators(runOn, entryIds) {
            if (this.za) return
            const ids = entryIds ?? this.m.items()
            for (const id of ids) {
                const entry = this.m.read(id)
                if (entry) {
                    void this.ej(entry, runOn)
                }
            }
        }
        runCollectionValidators() {
            if (this.za) return
            const api = this.a.api
            const collection = api.getOutputCollectionState()
            const errors = []
            const collectionValidators = this.La.collectionValidators
            for (const validator of [...this.dj, ...collectionValidators]) {
                try {
                    const error = validator(collection, api)
                    if (!error) {
                        continue
                    }
                    if (error) {
                        errors.push(this.If(error))
                        if (!error.message) {
                            console.warn(LOG_TEXT.MISSING_ERROR_MESSAGE)
                        }
                    }
                } catch (error) {
                    console.warn(LOG_TEXT.COLLECTION_VALIDATION_FAILED, error)
                }
            }
            this.b.pub("*collectionErrors", errors)
            if (errors.length > 0) {
                this.a.eventEmitter.emit(
                    EventType.COMMON_UPLOAD_FAILED,
                    () => api.getOutputCollectionState(),
                    {
                        debounce: true,
                    }
                )
            }
        }
        cleanupValidationForEntry(entry) {
            const state = this.fb.get(entry.uid)
            if (state) {
                state.abortController?.abort()
                this.fb.delete(entry.uid)
            }
        }
        async ej(entry, runOn) {
            if (this.za) return
            const api = this.a.api
            const state = this.Jf(entry)
            const previousPromise = state.promise ?? Promise.resolve()
            const runPromise = (async () => {
                if (this.za) return
                await previousPromise
                if (this.za) return
                const entryDescriptors = this.fj(entry, runOn)
                if (
                    entryDescriptors.length === 0 ||
                    !this.m.hasItem(entry.uid)
                ) {
                    return
                }
                entry.setMultipleValues({
                    isQueuedForValidation: true,
                    isValidationPending: true,
                })
                const outputEntry = api.getOutputItem(entry.uid)
                const abortController = new AbortController()
                state.abortController = abortController
                const timeoutMs = this.La.validationTimeout
                const allDescriptors = this.Kf()
                const entryValidatorSet = new Set(
                    entryDescriptors.map((d7) => d7.validator)
                )
                const errors = []
                for (const descriptor of allDescriptors) {
                    if (!entryValidatorSet.has(descriptor.validator)) {
                        const error = state.lastErrorThrownByValidator.get(
                            descriptor.validator
                        )
                        if (error) errors.push(error)
                    }
                }
                const tasks = entryDescriptors.map(
                    (validatorDescriptor) => async () => {
                        if (this.za) return
                        const timeoutId = setTimeout(() => {
                            state.skippedValidators.add(
                                validatorDescriptor.validator
                            )
                            abortController.abort()
                            console.warn(LOG_TEXT.FILE_VALIDATION_TIMEOUT)
                        }, timeoutMs)
                        try {
                            const error = await validatorDescriptor.validator(
                                outputEntry,
                                api,
                                {
                                    signal: abortController.signal,
                                }
                            )
                            if (!error || abortController.signal.aborted) {
                                state.lastErrorThrownByValidator.set(
                                    validatorDescriptor.validator,
                                    void 0
                                )
                                return
                            }
                            const normalizedError = this.If(error)
                            state.lastErrorThrownByValidator.set(
                                validatorDescriptor.validator,
                                normalizedError
                            )
                            errors.push(normalizedError)
                            if (!error.message) {
                                console.warn(LOG_TEXT.MISSING_ERROR_MESSAGE)
                            }
                        } catch (error) {
                            if (!abortController.signal.aborted) {
                                state.skippedValidators.add(
                                    validatorDescriptor.validator
                                )
                                console.warn(
                                    LOG_TEXT.FILE_VALIDATION_FAILED,
                                    error
                                )
                                this.a.telemetryManager.sendEventError(
                                    error,
                                    `file validator. ${LOG_TEXT.FILE_VALIDATION_FAILED}`
                                )
                            }
                        } finally {
                            clearTimeout(timeoutId)
                            if (validatorDescriptor.runOn !== "change") {
                                state.skippedValidators.add(
                                    validatorDescriptor.validator
                                )
                            }
                        }
                    }
                )
                this.Hf()
                await this.eb.add(
                    async () => {
                        if (this.za) return
                        entry.setValue("isQueuedForValidation", false)
                        await Promise.all(tasks.map((task) => task())).catch(
                            () => {}
                        )
                    },
                    {
                        autoRun: false,
                    }
                )
                if (abortController.signal.aborted) {
                    entry.setMultipleValues({
                        isQueuedForValidation: false,
                        isValidationPending: false,
                    })
                    return
                }
                entry.setMultipleValues({
                    isValidationPending: false,
                    isQueuedForValidation: false,
                    errors,
                })
            })()
            state.promise = runPromise
            try {
                await runPromise
            } finally {
                if (state.promise === runPromise) {
                    state.promise = void 0
                }
            }
        }
        If(error) {
            return {
                ...error,
                type: error.type ?? "CUSTOM_ERROR",
            }
        }
        Jf(entry) {
            const currentState = this.fb.get(entry.uid)
            if (currentState) {
                return currentState
            }
            const newState = {
                abortController: void 0,
                skippedValidators: /* @__PURE__ */ new WeakSet(),
                promise: void 0,
                lastErrorThrownByValidator: /* @__PURE__ */ new WeakMap(),
            }
            this.fb.set(entry.uid, newState)
            return newState
        }
        Kf() {
            const fileValidators = this.La.fileValidators
            return [...this.cj, ...fileValidators].map(getValidatorDescriptor)
        }
        fj(entry, runOn) {
            const state = this.Jf(entry)
            return this.Kf()
                .filter(
                    (descriptor) =>
                        !state.skippedValidators.has(descriptor.validator)
                )
                .filter((descriptor) => descriptor.runOn === runOn)
        }
        destroy() {
            this.za = true
            this.Hf.cancel()
            for (const state of this.fb.values()) {
                state.abortController?.abort()
                state.promise = void 0
            }
            this.fb.clear()
        }
    }

    // src/abstract/TypedData.ts
    var MSG_NAME = "[Typed State] Wrong property name: "
    var TypedData = class {
        constructor(initialValue) {
            this.ba = UID.generateFastUid()
            this.Y = PubSub.registerCtx(initialValue, this.ba)
        }
        get uid() {
            return this.ba
        }
        setValue(prop, value) {
            if (!this.Y.has(prop)) {
                console.warn(`${MSG_NAME}${String(prop)}`)
                return
            }
            const isChanged = this.Y.read(prop) !== value
            if (isChanged) {
                this.Y.pub(prop, value)
            }
        }
        setMultipleValues(updObj) {
            for (const [prop, value] of Object.entries(updObj)) {
                this.setValue(prop, value)
            }
        }
        getValue(prop) {
            if (!this.Y.has(prop)) {
                console.warn(`${MSG_NAME}${String(prop)}`)
            }
            return this.Y.read(prop)
        }
        subscribe(prop, handler) {
            return this.Y.sub(prop, handler)
        }
        destroy() {
            PubSub.deleteCtx(this.ba)
        }
    }

    // src/abstract/TypedCollection.ts
    var TypedCollection = class _TypedCollection {
        constructor(options) {
            this.Aa = /* @__PURE__ */ Object.create(null)
            this.tc = /* @__PURE__ */ new Set()
            this.uc = /* @__PURE__ */ new Set()
            this.Z = /* @__PURE__ */ new Set()
            this.Ed = /* @__PURE__ */ new Set()
            this.Fd = /* @__PURE__ */ new Set()
            this.gb = /* @__PURE__ */ new Set()
            this.Nf = options.initialValue
            this.ba = UID.generateFastUid()
            this.Y = PubSub.registerCtx({}, this.ba)
            this.Lf = options.watchList || []
            let changeMap = /* @__PURE__ */ Object.create(null)
            this.Mf = (propName, ctxId) => {
                if (this.Ab) {
                    window.clearTimeout(this.Ab)
                }
                if (!changeMap[propName]) {
                    changeMap[propName] = /* @__PURE__ */ new Set()
                }
                changeMap[propName].add(ctxId)
                this.Ab = window.setTimeout(() => {
                    if (Object.keys(changeMap).length === 0) {
                        return
                    }
                    this.tc.forEach((handler) => {
                        handler({ ...changeMap })
                    })
                    changeMap = /* @__PURE__ */ Object.create(null)
                })
                this.Of()
            }
            if (options.handler) {
                this.observeCollection(options.handler)
            }
        }
        static {
            this.gj = 1e4
        }
        Q() {
            if (this.Bb) {
                window.clearTimeout(this.Bb)
            }
            this.Bb = window.setTimeout(() => {
                const added = new Set(this.Fd)
                const removed = new Set(this.Ed)
                this.Fd.clear()
                this.Ed.clear()
                for (const handler of this.uc) {
                    handler?.([...this.Z], added, removed)
                }
                this.Of()
            })
        }
        Of() {
            if (this.gb.size === 0) {
                return
            }
            if (this.Cb) {
                window.clearTimeout(this.Cb)
            }
            this.Cb = window.setTimeout(() => {
                const marked = [...this.gb]
                this.gb.clear()
                for (const item of marked) {
                    item.destroy()
                }
            }, _TypedCollection.gj)
        }
        observeCollection(handler) {
            this.uc.add(handler)
            if (this.Z.size > 0) {
                this.Q()
            }
            return () => {
                this.unobserveCollection(handler)
            }
        }
        unobserveCollection(handler) {
            this.uc.delete(handler)
        }
        add(init, options = {}) {
            const item = new TypedData(this.Nf)
            for (const [prop, value] of Object.entries(init)) {
                item.setValue(prop, value)
            }
            if (options.index === void 0) {
                this.Z.add(item.uid)
            } else {
                const ids = [...this.Z]
                const at = Math.min(
                    Math.max(Math.trunc(options.index) || 0, 0),
                    ids.length
                )
                ids.splice(at, 0, item.uid)
                this.Z = new Set(ids)
            }
            this.Q()
            this.Y.add(item.uid, item)
            this.Fd.add(item)
            this.Lf.forEach((propName) => {
                if (!this.Aa[item.uid]) {
                    this.Aa[item.uid] = []
                }
                this.Aa[item.uid]?.push(
                    item.subscribe(propName, () => {
                        this.Mf(propName, item.uid)
                    })
                )
            })
            return item.uid
        }
        hasItem(id) {
            return this.Z.has(id)
        }
        read(id) {
            return this.Y.read(id) ?? null
        }
        readProp(id, propName) {
            const item = this.read(id)
            if (!item) {
                throw new Error(
                    `TypedCollection#readProp: Item with id ${id} not found`
                )
            }
            return item.getValue(propName)
        }
        publishProp(id, propName, value) {
            const item = this.read(id)
            if (!item) {
                throw new Error(
                    `TypedCollection#publishProp: Item with id ${id} not found`
                )
            }
            item.setValue(propName, value)
        }
        remove(id) {
            const item = this.read(id)
            if (item) {
                this.Ed.add(item)
                this.gb.add(item)
            }
            this.Z.delete(id)
            this.Q()
            this.Y.pub(id, void 0)
            this.Aa[id]?.forEach((sub) => {
                sub()
            })
            delete this.Aa[id]
        }
        abort(id) {
            const item = this.read(id)
            if (item?.getValue("isUploading")) {
                this.remove(id)
            }
        }
        abortAll() {
            this.Z.forEach((id) => {
                this.abort(id)
            })
        }
        clearAll() {
            this.Z.forEach((id) => {
                this.remove(id)
            })
        }
        observeProperties(handler) {
            this.tc.add(handler)
            return () => {
                this.unobserveProperties(handler)
            }
        }
        unobserveProperties(handler) {
            this.tc.delete(handler)
        }
        findItems(checkFn) {
            const result = []
            this.Z.forEach((id) => {
                const item = this.read(id)
                if (item && checkFn(item)) {
                    result.push(id)
                }
            })
            return result
        }
        items() {
            return [...this.Z]
        }
        get size() {
            return this.Z.size
        }
        destroy() {
            if (this.Ab) {
                window.clearTimeout(this.Ab)
            }
            if (this.Bb) {
                window.clearTimeout(this.Bb)
            }
            if (this.Cb) {
                window.clearTimeout(this.Cb)
            }
            for (const item of this.gb) {
                item.destroy()
            }
            this.gb.clear()
            PubSub.deleteCtx(this.ba)
            this.tc = /* @__PURE__ */ new Set()
            this.uc = /* @__PURE__ */ new Set()
            for (const id of Object.keys(this.Aa)) {
                this.Aa[id]?.forEach((sub) => {
                    sub()
                })
                delete this.Aa[id]
            }
        }
    }

    // src/blocks/CameraSource/constants.ts
    var CameraSourceTypes = Object.freeze({
        PHOTO: "photo",
        VIDEO: "video",
    })

    // src/blocks/CameraSource/calcCameraModes.ts
    var calcCameraModes = (cfg) => ({
        isVideoRecordingEnabled: deserializeCsv(cfg.cameraModes).includes(
            CameraSourceTypes.VIDEO
        ),
        isPhotoEnabled: deserializeCsv(cfg.cameraModes).includes(
            CameraSourceTypes.PHOTO
        ),
    })

    // src/lit/findBlockInCtx.ts
    var findBlockInCtx = (blocksRegistry, callback) => {
        for (const block of blocksRegistry) {
            if (callback(block)) {
                return block
            }
        }
        return void 0
    }

    // src/lit/hasBlockInCtx.ts
    var waitForBlockInCtx = (
        blocksRegistry,
        callback,
        { timeout = 1e3, onTimeout } = {}
    ) => {
        return new Promise((resolve) => {
            let rafId
            const timer = setTimeout(() => {
                cancelAnimationFrame(rafId)
                onTimeout?.()
            }, timeout)
            const check = () => {
                for (const block of blocksRegistry) {
                    if (callback(block)) {
                        clearTimeout(timer)
                        resolve(block)
                        return
                    }
                }
                rafId = requestAnimationFrame(check)
            }
            check()
        })
    }

    // src/utils/applyStyles.ts
    function applyStyles(el, styleMap) {
        for (const prop in styleMap) {
            if (prop.includes("-")) {
                el.style.setProperty(prop, String(styleMap[prop]))
            } else {
                el.style[prop] = String(styleMap[prop])
            }
        }
    }

    // src/utils/parseCdnUrl.ts
    var uuidRegex =
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
    var cdnUrlRegex = new RegExp(
        `^/?(${uuidRegex.source})(?:/(-/(?:[^/]+/)+)?([^/]*))?$`,
        "i"
    )
    var parseCdnUrl = ({ url, cdnBase }) => {
        const cdnBaseUrlObj = new URL(cdnBase)
        const fallbackCdnBaseUrlObj = new URL(DEFAULT_CDN_CNAME)
        const urlObj = new URL(url)
        if (
            cdnBaseUrlObj.host !== urlObj.host &&
            fallbackCdnBaseUrlObj.host !== urlObj.host
        ) {
            return null
        }
        const match = cdnUrlRegex.exec(urlObj.pathname)
        if (!match) {
            return null
        }
        const [, uuid, cdnUrlModifiers, filename] = match
        if (!uuid) {
            return null
        }
        return {
            uuid,
            cdnUrlModifiers: cdnUrlModifiers || "",
            filename: filename || null,
        }
    }

    // src/utils/UploadSource.ts
    var ExternalUploadSource = Object.freeze({
        FACEBOOK: "facebook",
        DROPBOX: "dropbox",
        DROPBOX_CHOOSER: "dropboxchooser",
        GDRIVE: "gdrive",
        GPHOTOS: "gphotos",
        BOX: "box",
        ONEDRIVE: "onedrive",
    })
    var UploadSourceMobile = Object.freeze({
        MOBILE_VIDEO_CAMERA: "mobile-video-camera",
        MOBILE_PHOTO_CAMERA: "mobile-photo-camera",
    })
    var UploadSource = Object.freeze({
        LOCAL: "local",
        DROP_AREA: "drop-area",
        CAMERA: "camera",
        EXTERNAL: "external",
        API: "js-api",
        URL: "url",
        ...UploadSourceMobile,
        ...ExternalUploadSource,
    })
    var SOURCE_L10N_KEY_MAP = {
        [ExternalUploadSource.DROPBOX_CHOOSER]: ExternalUploadSource.DROPBOX,
    }
    var canonicalSourceName = (source) => SOURCE_L10N_KEY_MAP[source] ?? source

    // src/lit/getOutputData.ts
    var getOutputData = (bag) => {
        const entriesIds = bag.uploadCollection.items()
        const data = entriesIds.map((itemId) => bag.api.getOutputItem(itemId))
        return data
    }

    // src/utils/memoize.ts
    function memoize(fn) {
        const cache = /* @__PURE__ */ new Map()
        const memoized = (...args) => {
            const key = JSON.stringify(args)
            if (cache.has(key)) {
                return cache.get(key)
            }
            const result = fn(...args)
            cache.set(key, result)
            return result
        }
        return memoized
    }

    // src/utils/warnOnce.ts
    var warnings = /* @__PURE__ */ new Set()
    function warnOnce(message) {
        if (warnings.has(message)) {
            return
        }
        warnings.add(message)
        console.warn(message)
    }

    // src/abstract/buildOutputCollectionState.ts
    function createAsyncAssertWrapper(warning) {
        let isAsync = false
        setTimeout(() => {
            isAsync = true
        }, 0)
        const withAssert = (fn) => {
            return (...args) => {
                if (isAsync) {
                    warnOnce(warning)
                }
                return fn(...args)
            }
        }
        return withAssert
    }
    function buildOutputCollectionState(bag) {
        const state = {}
        const ctx = bag.ctx
        const getters = {
            progress: () => {
                return ctx.read("*commonProgress")
            },
            errors: () => {
                return ctx.read("*collectionErrors")
            },
            group: () => {
                return ctx.read("*groupInfo")
            },
            totalCount: () => {
                return bag.uploadCollection.size
            },
            failedCount: () => {
                return state.failedEntries.length
            },
            successCount: () => {
                return state.successEntries.length
            },
            uploadingCount: () => {
                return state.uploadingEntries.length
            },
            status: () => {
                const status = state.isFailed
                    ? "failed"
                    : state.isUploading
                      ? "uploading"
                      : state.isSuccess
                        ? "success"
                        : "idle"
                return status
            },
            isSuccess: () => {
                return (
                    state.allEntries.length > 0 &&
                    state.errors.length === 0 &&
                    state.successEntries.length === state.allEntries.length
                )
            },
            isUploading: () => {
                return state.allEntries.some(
                    (entry) => entry.status === "uploading"
                )
            },
            isFailed: () => {
                return state.errors.length > 0 || state.failedEntries.length > 0
            },
            allEntries: () => {
                return getOutputData(bag)
            },
            successEntries: () => {
                return state.allEntries.filter(
                    (entry) => entry.status === "success"
                )
            },
            failedEntries: () => {
                return state.allEntries.filter(
                    (entry) => entry.status === "failed"
                )
            },
            uploadingEntries: () => {
                return state.allEntries.filter(
                    (entry) => entry.status === "uploading"
                )
            },
            idleEntries: () => {
                return state.allEntries.filter(
                    (entry) => entry.status === "idle"
                )
            },
        }
        const withAssert = createAsyncAssertWrapper(
            "You're trying to access the OutputCollectionState asynchronously. In this case, the data you retrieve will be newer than it was when the OutputCollectionState was created or when the event was dispatched. If you want to retain the state at a specific moment in time, you should use the spread operator like this: `{...outputCollectionState}` or `{...e.detail}`"
        )
        for (const [key, value] of Object.entries(getters)) {
            const name = key
            const getter = value
            const wrapped = memoize(withAssert(getter))
            Object.defineProperty(state, name, {
                get: wrapped,
                enumerable: true,
            })
        }
        return state
    }

    // src/abstract/uploadEntrySchema.ts
    var initialUploadEntryData = {
        file: null,
        externalUrl: null,
        fileName: null,
        fileSize: null,
        lastModified: Date.now(),
        uploadProgress: 0,
        uuid: null,
        isImage: false,
        mimeType: null,
        ctxName: null,
        cdnUrl: null,
        cdnUrlModifiers: null,
        fileInfo: null,
        isUploading: false,
        abortController: null,
        thumbUrl: null,
        silent: false,
        source: null,
        fullPath: null,
        metadata: null,
        tags: null,
        errors: [],
        uploadError: null,
        isRemoved: false,
        isQueuedForUploading: false,
        isValidationPending: false,
        isQueuedForValidation: false,
    }
    function uploadcareFileToEntryData(file) {
        return {
            fileInfo: file,
            uuid: file.uuid,
            cdnUrl: file.cdnUrl,
            fileName: file.originalFilename ?? null,
            fileSize: file.size,
            isImage: file.isImage ?? false,
            mimeType: file.contentInfo?.mime?.mime ?? file.mimeType ?? null,
            uploadProgress: 100,
        }
    }

    // src/abstract/UploaderPublicApi.ts
    var UploaderPublicApi = class extends SharedInstance {
        constructor() {
            super(...arguments)
            this.bb = createL10n(() => this.b)
            /**
             * TODO: Probably we should not allow user to override `source` property
             */
            this.addFileFromUrl = (url, { silent, fileName, source } = {}) => {
                const internalId = this.m.add({
                    externalUrl: url,
                    fileName: fileName ?? null,
                    silent: silent ?? false,
                    source: source ?? UploadSource.API,
                })
                return this.getOutputItem(internalId)
            }
            this.addFileFromUuid = (
                uuid,
                { silent, fileName, source } = {}
            ) => {
                const internalId = this.m.add({
                    uuid,
                    fileName: fileName ?? null,
                    silent: silent ?? false,
                    source: source ?? UploadSource.API,
                })
                return this.getOutputItem(internalId)
            }
            this.addFileFromCdnUrl = (
                cdnUrl,
                { silent, fileName, source } = {}
            ) => {
                const parsedCdnUrl = parseCdnUrl({
                    url: cdnUrl,
                    cdnBase: this.cfg.cdnCname,
                })
                if (!parsedCdnUrl) {
                    throw new Error("Invalid CDN URL")
                }
                const internalId = this.m.add({
                    uuid: parsedCdnUrl.uuid,
                    cdnUrl,
                    cdnUrlModifiers: parsedCdnUrl.cdnUrlModifiers,
                    fileName: fileName ?? parsedCdnUrl.filename ?? null,
                    silent: silent ?? false,
                    source: source ?? UploadSource.API,
                })
                return this.getOutputItem(internalId)
            }
            this.addFileFromObject = (
                file,
                { silent, fileName, source, fullPath } = {}
            ) => {
                const internalId = this.m.add({
                    file,
                    isImage: fileIsImage(file),
                    mimeType: file.type || null,
                    fileName: fileName ?? file.name,
                    fileSize: file.size,
                    silent: silent ?? false,
                    source: source ?? UploadSource.API,
                    fullPath: fullPath ?? null,
                })
                return this.getOutputItem(internalId)
            }
            this.addFileFromUploadcareFile = (
                file,
                { silent, fileName, source } = {}
            ) => {
                const internalId = this.m.add({
                    ...uploadcareFileToEntryData(file),
                    // A caller-supplied name takes precedence over the file's own.
                    fileName: fileName ?? file.originalFilename ?? null,
                    silent: silent ?? false,
                    source: source ?? UploadSource.API,
                })
                return this.getOutputItem(internalId)
            }
            /**
             * Replace an existing entry with an already-uploaded Uploadcare file, keeping
             * its position in the list. The original entry is removed and a fresh one is
             * added in its place, so the replacement goes through the full add pipeline
             * (validators, events) like any newly added file.
             *
             * The original entry's `source`, `metadata`, `fullPath` and `silent` are
             * preserved by default; `silent`, `fileName` and `source` can be overridden
             * via `options`.
             *
             * Returns the new entry. Note: it has a NEW `internalId` — use the returned
             * entry to reference the replacement going forward.
             */
            this.replaceFile = (
                internalId,
                file,
                { silent, fileName, source } = {}
            ) => {
                const oldId = internalId
                const collection = this.m
                const index = collection.items().indexOf(oldId)
                const oldEntry = collection.read(oldId)
                if (index === -1 || !oldEntry) {
                    throw new Error(
                        `File with internalId ${internalId} not found`
                    )
                }
                const preserved = {
                    source: oldEntry.getValue("source"),
                    metadata: oldEntry.getValue("metadata"),
                    fullPath: oldEntry.getValue("fullPath"),
                    silent: oldEntry.getValue("silent"),
                }
                collection.remove(oldId)
                const newId = collection.add(
                    {
                        ...uploadcareFileToEntryData(file),
                        fileName: fileName ?? file.originalFilename ?? null,
                        silent: silent ?? preserved.silent,
                        source: source ?? preserved.source ?? UploadSource.API,
                        metadata: preserved.metadata,
                        fullPath: preserved.fullPath,
                    },
                    { index }
                )
                return this.getOutputItem(newId)
            }
            this.removeFileByInternalId = (internalId) => {
                if (!this.m.read(internalId)) {
                    throw new Error(
                        `File with internalId ${internalId} not found`
                    )
                }
                this.m.remove(internalId)
            }
            this.uploadAll = () => {
                const itemsToUpload = this.m.items().filter((id) => {
                    const entry = this.m.read(id)
                    if (!entry) return false
                    return (
                        !entry.getValue("isRemoved") &&
                        !entry.getValue("isUploading") &&
                        !entry.getValue("fileInfo") &&
                        entry.getValue("errors").length === 0 &&
                        !entry.getValue("isValidationPending") &&
                        !entry.getValue("isQueuedForValidation")
                    )
                })
                if (itemsToUpload.length === 0) {
                    return
                }
                this.b.pub("*uploadTrigger", new Set(itemsToUpload))
                this.a.eventEmitter.emit(
                    EventType.COMMON_UPLOAD_START,
                    this.getOutputCollectionState()
                )
            }
            this.openSystemDialog = (options = {}) => {
                const accept = serializeCsv(
                    mergeFileTypes([
                        this.cfg.accept ?? "",
                        ...(this.cfg.imgOnly ? IMAGE_ACCEPT_LIST : []),
                    ])
                )
                const INPUT_ATTR_NAME = "uploadcare-file-input"
                const fileInput = document.createElement("input")
                fileInput.setAttribute(INPUT_ATTR_NAME, "")
                applyStyles(fileInput, {
                    opacity: 0,
                    height: 0,
                    width: 0,
                    visibility: "hidden",
                    position: "absolute",
                    top: 0,
                    left: 0,
                })
                fileInput.type = "file"
                fileInput.multiple = this.cfg.multiple
                if (options.captureCamera) {
                    fileInput.capture = this.cfg.cameraCapture
                    const { isPhotoEnabled, isVideoRecordingEnabled } =
                        calcCameraModes(this.cfg)
                    if (
                        options.modeCamera === CameraSourceTypes.PHOTO &&
                        isPhotoEnabled
                    ) {
                        fileInput.accept = BASIC_IMAGE_WILDCARD
                    } else if (
                        options.modeCamera === CameraSourceTypes.VIDEO &&
                        isVideoRecordingEnabled
                    ) {
                        fileInput.accept = BASIC_VIDEO_WILDCARD
                    } else {
                        fileInput.accept = [
                            BASIC_IMAGE_WILDCARD,
                            isVideoRecordingEnabled && BASIC_VIDEO_WILDCARD,
                        ]
                            .filter(Boolean)
                            .join(",")
                    }
                } else {
                    fileInput.accept = accept
                }
                fileInput.addEventListener(
                    "change",
                    () => {
                        if (!fileInput.files) {
                            return
                        }
                        ;[...fileInput.files].forEach((file) => {
                            this.addFileFromObject(file, {
                                source: options.captureCamera
                                    ? UploadSource.CAMERA
                                    : UploadSource.LOCAL,
                            })
                        })
                        this.a.routerLayer.navigateAfterFileAdd()
                        fileInput.remove()
                    },
                    {
                        once: true,
                    }
                )
                document
                    .querySelectorAll(`[${INPUT_ATTR_NAME}]`)
                    .forEach((el) => {
                        el.remove()
                    })
                document.body.appendChild(fileInput)
                fileInput.dispatchEvent(new MouseEvent("click"))
            }
            this.initFlow = (force = false) => {
                if (this.m.size > 0 && !force) {
                    this.b.pub("*currentActivity", ACTIVITY_TYPES.UPLOAD_LIST)
                    this.a.modalManager?.open(ACTIVITY_TYPES.UPLOAD_LIST)
                } else {
                    if (this.Pf?.length === 1) {
                        const srcKey = this.Pf[0]
                        void this.Gd().then(() => {
                            const sources =
                                this.a.pluginManager.snapshot().sources
                            const registeredSource = sources.find(
                                (s11) => s11.id === srcKey
                            )
                            if (registeredSource) {
                                const expandedIds =
                                    registeredSource.expand?.() ?? [srcKey]
                                if (expandedIds.length === 1) {
                                    const target =
                                        sources.find(
                                            (s11) => s11.id === expandedIds[0]
                                        ) ?? registeredSource
                                    target.onSelect()
                                } else {
                                    this.b.pub(
                                        "*currentActivity",
                                        ACTIVITY_TYPES.START_FROM
                                    )
                                    this.a.modalManager?.open(
                                        ACTIVITY_TYPES.START_FROM
                                    )
                                }
                                return
                            }
                            if (this.b.read("*currentActivity")) {
                                this.a.modalManager?.open(
                                    this.b.read("*currentActivity")
                                )
                            }
                        })
                    } else {
                        this.b.pub(
                            "*currentActivity",
                            ACTIVITY_TYPES.START_FROM
                        )
                        this.a.modalManager?.open(ACTIVITY_TYPES.START_FROM)
                    }
                }
            }
            this.doneFlow = () => {
                const activityBlock = findBlockInCtx(
                    this.a.blocksRegistry,
                    (b3) => "doneActivity" in b3
                )
                if (!activityBlock) {
                    return
                }
                this.b.pub("*currentActivity", activityBlock.doneActivity)
                this.b.pub(
                    "*history",
                    activityBlock.doneActivity
                        ? [activityBlock.doneActivity]
                        : []
                )
                if (!this.b.read("*currentActivity")) {
                    this.a.modalManager?.closeAll()
                }
            }
            this.setCurrentActivity = (activityType, ...params) => {
                void this.Gd().then(() => {
                    this.b.pub("*currentActivityParams", params[0] ?? {})
                    this.b.pub("*currentActivity", activityType)
                    waitForBlockInCtx(
                        this.a.blocksRegistry,
                        (b3) => b3.activityType === activityType,
                        {
                            onTimeout: () =>
                                console.warn(
                                    `Activity type "${activityType}" not found in the context`
                                ),
                            timeout: 100,
                        }
                    )
                })
            }
            this.on = (type, handler) => {
                return this.a.eventEmitter.on(type, handler)
            }
            this.getCurrentActivity = () => {
                return this.b.read("*currentActivity")
            }
            this.historyBack = () => {
                const fn = this.b.read("*historyBack")
                fn?.()
            }
            this.setModalState = (opened) => {
                void this.Gd().then(() => {
                    if (!opened) {
                        this.a.modalManager?.close(
                            this.b.read("*currentActivity")
                        )
                        this.b.pub("*currentActivity", null)
                        return
                    }
                    const activityType = this.b.read("*currentActivity")
                    if (!activityType) {
                        console.warn(
                            `Can't open modal without current activity. Please use "setCurrentActivity" method first.`
                        )
                        return
                    }
                    return waitForBlockInCtx(
                        this.a.blocksRegistry,
                        (b3) => b3.activityType === activityType,
                        {
                            onTimeout: () =>
                                console.warn(
                                    `Activity block "${activityType}" not found in the context`
                                ),
                        }
                    ).then(() => {
                        this.a.modalManager?.open(activityType)
                    })
                })
            }
        }
        get m() {
            return this.a.uploadCollection
        }
        get cfg() {
            return this.La
        }
        get l10n() {
            return this.bb
        }
        removeAllFiles() {
            this.m.clearAll()
        }
        getOutputItem(entryId) {
            const ctx = PubSub.getCtx(entryId)
            if (!ctx) {
                throw new Error(
                    `UploaderPublicApi#getOutputItem: Entry with ID "${entryId}" not found in the upload collection`
                )
            }
            const uploadEntryData = ctx.store
            const fileInfo = uploadEntryData.fileInfo
            const status = uploadEntryData.isRemoved
                ? "removed"
                : uploadEntryData.errors.length > 0
                  ? "failed"
                  : uploadEntryData.fileInfo
                    ? "success"
                    : uploadEntryData.isUploading
                      ? "uploading"
                      : "idle"
            const outputItem = {
                uuid: fileInfo?.uuid ?? uploadEntryData.uuid ?? null,
                internalId: entryId,
                // An explicit entry `fileName` (e.g. a caller-supplied name on add/replace)
                // wins over the uploaded file's own name; otherwise fall back to it.
                name:
                    uploadEntryData.fileName ??
                    fileInfo?.originalFilename ??
                    null,
                size: fileInfo?.size ?? uploadEntryData.fileSize,
                isImage: fileInfo?.isImage ?? uploadEntryData.isImage,
                mimeType: fileInfo?.mimeType ?? uploadEntryData.mimeType,
                file: uploadEntryData.file,
                externalUrl: uploadEntryData.externalUrl,
                cdnUrlModifiers: uploadEntryData.cdnUrlModifiers,
                cdnUrl: uploadEntryData.cdnUrl ?? fileInfo?.cdnUrl ?? null,
                fullPath: uploadEntryData.fullPath,
                uploadProgress: uploadEntryData.uploadProgress,
                fileInfo: fileInfo ?? null,
                metadata:
                    uploadEntryData.metadata ?? fileInfo?.metadata ?? null,
                tags: uploadEntryData.tags ?? fileInfo?.tags ?? null,
                isSuccess: status === "success",
                isUploading: status === "uploading",
                isFailed: status === "failed",
                isRemoved: status === "removed",
                isValidationPending: uploadEntryData.isValidationPending,
                errors: uploadEntryData.errors,
                status,
                source: uploadEntryData?.source,
            }
            return outputItem
        }
        getOutputCollectionState() {
            return buildOutputCollectionState(this.a)
        }
        async Gd() {
            const pluginManager = await this.a.wait("pluginManager")
            return pluginManager.pluginsReady()
        }
        get Pf() {
            let list = []
            if (this.cfg.sourceList) {
                list = stringToArray(this.cfg.sourceList)
            }
            return list
        }
    }

    // src/blocks/CloudImageEditor/src/cropper-constants.ts
    var CROP_PADDING = 20
    var THUMB_CORNER_SIZE = 24
    var THUMB_SIDE_SIZE = 34
    var THUMB_STROKE_WIDTH = 3
    var THUMB_OFFSET = THUMB_STROKE_WIDTH / 2
    var GUIDE_STROKE_WIDTH = 1
    var GUIDE_THIRD = 100 / 3
    var MIN_CROP_SIZE = 1
    var MAX_INTERACTION_SIZE = 24
    var MIN_INTERACTION_SIZE = 6

    // src/blocks/CloudImageEditor/src/crop-utils.ts
    function setSvgNodeAttrs(node, attrs) {
        for (const [name, value] of Object.entries(attrs)) {
            node.setAttributeNS(null, name, value.toString())
        }
    }
    function createSvgNode(name, attrs = {}) {
        const node = document.createElementNS(
            "http://www.w3.org/2000/svg",
            name
        )
        setSvgNodeAttrs(node, attrs)
        return node
    }
    function cornerPath(rect, direction, sizeMultiplier) {
        const { x: x2, y: y4, width, height } = rect
        const wMul = direction.includes("w") ? 0 : 1
        const hMul = direction.includes("n") ? 0 : 1
        const xSide = wMul === 0 ? -1 : 1
        const ySide = hMul === 0 ? -1 : 1
        const p1 = [
            x2 + wMul * width + THUMB_OFFSET * xSide,
            y4 +
                hMul * height +
                THUMB_OFFSET * ySide -
                THUMB_CORNER_SIZE * sizeMultiplier * ySide,
        ]
        const p22 = [
            x2 + wMul * width + THUMB_OFFSET * xSide,
            y4 + hMul * height + THUMB_OFFSET * ySide,
        ]
        const p32 = [
            x2 +
                wMul * width -
                THUMB_CORNER_SIZE * sizeMultiplier * xSide +
                THUMB_OFFSET * xSide,
            y4 + hMul * height + THUMB_OFFSET * ySide,
        ]
        const path = `M ${p1[0]} ${p1[1]} L ${p22[0]} ${p22[1]} L ${p32[0]} ${p32[1]}`
        const center = [p22[0], p22[1]]
        return {
            d: path,
            center,
        }
    }
    function sidePath(rect, direction, sizeMultiplier) {
        const { x: x2, y: y4, width, height } = rect
        const isHorizontal = direction === "n" || direction === "s"
        const isVertical = direction === "w" || direction === "e"
        const wMul = isHorizontal ? 0.5 : direction === "w" ? 0 : 1
        const hMul = isVertical ? 0.5 : direction === "n" ? 0 : 1
        const xSide = direction === "w" ? -1 : direction === "e" ? 1 : 0
        const ySide = direction === "n" ? -1 : direction === "s" ? 1 : 0
        let p1
        let p22
        if (isHorizontal) {
            p1 = [
                x2 + wMul * width - (THUMB_SIDE_SIZE * sizeMultiplier) / 2,
                y4 + hMul * height + THUMB_OFFSET * ySide,
            ]
            p22 = [
                x2 + wMul * width + (THUMB_SIDE_SIZE * sizeMultiplier) / 2,
                y4 + hMul * height + THUMB_OFFSET * ySide,
            ]
        } else {
            p1 = [
                x2 + wMul * width + THUMB_OFFSET * xSide,
                y4 + hMul * height - (THUMB_SIDE_SIZE * sizeMultiplier) / 2,
            ]
            p22 = [
                x2 + wMul * width + THUMB_OFFSET * xSide,
                y4 + hMul * height + (THUMB_SIDE_SIZE * sizeMultiplier) / 2,
            ]
        }
        const path = `M ${p1[0]} ${p1[1]} L ${p22[0]} ${p22[1]}`
        const center = [(p1[0] + p22[0]) / 2, (p1[1] + p22[1]) / 2]
        return { d: path, center }
    }
    function thumbCursor(direction) {
        if (direction === "") {
            return "move"
        }
        if (["e", "w"].includes(direction)) {
            return "ew-resize"
        }
        if (["n", "s"].includes(direction)) {
            return "ns-resize"
        }
        if (["nw", "se"].includes(direction)) {
            return "nwse-resize"
        }
        return "nesw-resize"
    }
    function moveRect({ rect, delta: [dx, dy], imageBox }) {
        return constraintRect(
            {
                ...rect,
                x: rect.x + dx,
                y: rect.y + dy,
            },
            imageBox
        )
    }
    function constraintRect(rect1, rect2) {
        let { x: x2 } = rect1
        let { y: y4 } = rect1
        if (rect1.x < rect2.x) {
            x2 = rect2.x
        } else if (rect1.x + rect1.width > rect2.x + rect2.width) {
            x2 = rect2.x + rect2.width - rect1.width
        }
        if (rect1.y < rect2.y) {
            y4 = rect2.y
        } else if (rect1.y + rect1.height > rect2.y + rect2.height) {
            y4 = rect2.y + rect2.height - rect1.height
        }
        return {
            ...rect1,
            x: x2,
            y: y4,
        }
    }
    function resizeNorth({ rect, delta, aspectRatio, imageBox }) {
        const [, dy] = delta
        let { y: y4, width, height } = rect
        y4 += dy
        height -= dy
        if (aspectRatio) {
            width = height * aspectRatio
        }
        let x2 = rect.x + rect.width / 2 - width / 2
        if (y4 <= imageBox.y) {
            y4 = imageBox.y
            height = rect.y + rect.height - y4
            if (aspectRatio) {
                width = height * aspectRatio
                x2 = rect.x + rect.width / 2 - width / 2
            }
        }
        if (x2 <= imageBox.x) {
            x2 = imageBox.x
            y4 = rect.y + rect.height - height
        }
        if (x2 + width >= imageBox.x + imageBox.width) {
            x2 = Math.max(imageBox.x, imageBox.x + imageBox.width - width)
            width = imageBox.x + imageBox.width - x2
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y + rect.height - height
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
                x2 = rect.x + rect.width / 2 - width / 2
            }
            y4 = rect.y + rect.height - height
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
                x2 = rect.x + rect.width / 2 - width / 2
            }
            y4 = rect.y + rect.height - height
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeWest({ rect, delta, aspectRatio, imageBox }) {
        const [dx] = delta
        let { x: x2, width, height } = rect
        x2 += dx
        width -= dx
        if (aspectRatio) {
            height = width / aspectRatio
        }
        let y4 = rect.y + rect.height / 2 - height / 2
        if (x2 <= imageBox.x) {
            x2 = imageBox.x
            width = rect.x + rect.width - x2
            if (aspectRatio) {
                height = width / aspectRatio
                y4 = rect.y + rect.height / 2 - height / 2
            }
        }
        if (y4 <= imageBox.y) {
            y4 = imageBox.y
            x2 = rect.x + rect.width - width
        }
        if (y4 + height >= imageBox.y + imageBox.height) {
            y4 = Math.max(imageBox.y, imageBox.y + imageBox.height - height)
            height = imageBox.y + imageBox.height - y4
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x + rect.width - width
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            y4 = rect.y + rect.height / 2 - height / 2
            x2 = rect.x + rect.width - width
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y + rect.height / 2 - height / 2
            x2 = rect.x + rect.width - width
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeSouth({ rect, delta, aspectRatio, imageBox }) {
        const [, dy] = delta
        let { y: y4, width, height } = rect
        height += dy
        if (aspectRatio) {
            width = height * aspectRatio
        }
        let x2 = rect.x + rect.width / 2 - width / 2
        if (y4 + height >= imageBox.y + imageBox.height) {
            height = imageBox.y + imageBox.height - y4
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x + rect.width / 2 - width / 2
        }
        if (x2 <= imageBox.x) {
            x2 = imageBox.x
            y4 = rect.y
        }
        if (x2 + width >= imageBox.x + imageBox.width) {
            x2 = Math.max(imageBox.x, imageBox.x + imageBox.width - width)
            width = imageBox.x + imageBox.width - x2
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x + rect.width / 2 - width / 2
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            x2 = rect.x + rect.width / 2 - width / 2
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeEast({ rect, delta, aspectRatio, imageBox }) {
        const [dx] = delta
        let { x: x2, width, height } = rect
        width += dx
        if (aspectRatio) {
            height = width / aspectRatio
        }
        let y4 = rect.y + rect.height / 2 - height / 2
        if (x2 + width >= imageBox.x + imageBox.width) {
            width = imageBox.x + imageBox.width - x2
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y + rect.height / 2 - height / 2
        }
        if (y4 <= imageBox.y) {
            y4 = imageBox.y
            x2 = rect.x
        }
        if (y4 + height >= imageBox.y + imageBox.height) {
            y4 = Math.max(imageBox.y, imageBox.y + imageBox.height - height)
            height = imageBox.y + imageBox.height - y4
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            y4 = rect.y + rect.height / 2 - height / 2
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y + rect.height / 2 - height / 2
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeNorthWest({ rect, delta, aspectRatio, imageBox }) {
        let [dx, dy] = delta
        let { x: x2, y: y4, width, height } = rect
        if (x2 + dx < imageBox.x) {
            dx = imageBox.x - x2
        }
        if (y4 + dy < imageBox.y) {
            dy = imageBox.y - y4
        }
        x2 += dx
        width -= dx
        y4 += dy
        height -= dy
        if (aspectRatio && Math.abs(width / height) > aspectRatio) {
            dy = width / aspectRatio - height
            height += dy
            y4 -= dy
            if (y4 <= imageBox.y) {
                height = height - (imageBox.y - y4)
                width = height * aspectRatio
                x2 = rect.x + rect.width - width
                y4 = imageBox.y
            }
        } else if (aspectRatio) {
            dx = height * aspectRatio - width
            width = width + dx
            x2 -= dx
            if (x2 <= imageBox.x) {
                width = width - (imageBox.x - x2)
                height = width / aspectRatio
                x2 = imageBox.x
                y4 = rect.y + rect.height - height
            }
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x + rect.width - width
            y4 = rect.y + rect.height - height
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            x2 = rect.x + rect.width - width
            y4 = rect.y + rect.height - height
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeNorthEast({ rect, delta, aspectRatio, imageBox }) {
        let [dx, dy] = delta
        let { x: x2, y: y4, width, height } = rect
        if (x2 + width + dx > imageBox.x + imageBox.width) {
            dx = imageBox.x + imageBox.width - x2 - width
        }
        if (y4 + dy < imageBox.y) {
            dy = imageBox.y - y4
        }
        width += dx
        y4 += dy
        height -= dy
        if (aspectRatio && Math.abs(width / height) > aspectRatio) {
            dy = width / aspectRatio - height
            height += dy
            y4 -= dy
            if (y4 <= imageBox.y) {
                height = height - (imageBox.y - y4)
                width = height * aspectRatio
                x2 = rect.x
                y4 = imageBox.y
            }
        } else if (aspectRatio) {
            dx = height * aspectRatio - width
            width += dx
            if (x2 + width >= imageBox.x + imageBox.width) {
                width = imageBox.x + imageBox.width - x2
                height = width / aspectRatio
                x2 = imageBox.x + imageBox.width - width
                y4 = rect.y + rect.height - height
            }
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            y4 = rect.y + rect.height - height
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            y4 = rect.y + rect.height - height
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeSouthWest({ rect, delta, aspectRatio, imageBox }) {
        let [dx, dy] = delta
        let { x: x2, y: y4, width, height } = rect
        if (x2 + dx < imageBox.x) {
            dx = imageBox.x - x2
        }
        if (y4 + height + dy > imageBox.y + imageBox.height) {
            dy = imageBox.y + imageBox.height - y4 - height
        }
        x2 += dx
        width -= dx
        height += dy
        if (aspectRatio && Math.abs(width / height) > aspectRatio) {
            dy = width / aspectRatio - height
            height += dy
            if (y4 + height >= imageBox.y + imageBox.height) {
                height = imageBox.y + imageBox.height - y4
                width = height * aspectRatio
                x2 = rect.x + rect.width - width
                y4 = imageBox.y + imageBox.height - height
            }
        } else if (aspectRatio) {
            dx = height * aspectRatio - width
            width += dx
            x2 -= dx
            if (x2 <= imageBox.x) {
                width = width - (imageBox.x - x2)
                height = width / aspectRatio
                x2 = imageBox.x
                y4 = rect.y
            }
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
            x2 = rect.x + rect.width - width
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
            x2 = rect.x + rect.width - width
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeSouthEast({ rect, delta, aspectRatio, imageBox }) {
        let [dx, dy] = delta
        let { x: x2, y: y4, width, height } = rect
        if (x2 + width + dx > imageBox.x + imageBox.width) {
            dx = imageBox.x + imageBox.width - x2 - width
        }
        if (y4 + height + dy > imageBox.y + imageBox.height) {
            dy = imageBox.y + imageBox.height - y4 - height
        }
        width += dx
        height += dy
        if (aspectRatio && Math.abs(width / height) > aspectRatio) {
            dy = width / aspectRatio - height
            height += dy
            if (y4 + height >= imageBox.y + imageBox.height) {
                height = imageBox.y + imageBox.height - y4
                width = height * aspectRatio
                x2 = rect.x
                y4 = imageBox.y + imageBox.height - height
            }
        } else if (aspectRatio) {
            dx = height * aspectRatio - width
            width += dx
            if (x2 + width >= imageBox.x + imageBox.width) {
                width = imageBox.x + imageBox.width - x2
                height = width / aspectRatio
                x2 = imageBox.x + imageBox.width - width
                y4 = rect.y
            }
        }
        if (height < MIN_CROP_SIZE) {
            height = MIN_CROP_SIZE
            if (aspectRatio) {
                width = height * aspectRatio
            }
        }
        if (width < MIN_CROP_SIZE) {
            width = MIN_CROP_SIZE
            if (aspectRatio) {
                height = width / aspectRatio
            }
        }
        return { x: x2, y: y4, width, height }
    }
    function resizeRect({ direction, ...rest }) {
        switch (direction) {
            case "n":
                return resizeNorth(rest)
            case "w":
                return resizeWest(rest)
            case "s":
                return resizeSouth(rest)
            case "e":
                return resizeEast(rest)
            case "nw":
                return resizeNorthWest(rest)
            case "ne":
                return resizeNorthEast(rest)
            case "sw":
                return resizeSouthWest(rest)
            case "se":
                return resizeSouthEast(rest)
            default:
                return rest.rect
        }
    }
    function rectContainsPoint(rect, [x2, y4]) {
        return (
            rect.x <= x2 &&
            x2 <= rect.x + rect.width &&
            rect.y <= y4 &&
            y4 <= rect.y + rect.height
        )
    }
    function isRectInsideRect(rect1, rect2) {
        return (
            rect1.x >= rect2.x &&
            rect1.y >= rect2.y &&
            rect1.x + rect1.width <= rect2.x + rect2.width &&
            rect1.y + rect1.height <= rect2.y + rect2.height
        )
    }
    function isRectMatchesAspectRatio(rect, aspectRatio) {
        const THRESHOLD = 0.1
        return Math.abs(rect.width / rect.height - aspectRatio) < THRESHOLD
    }
    function rotateSize({ width, height }, angle) {
        const swap = (angle / 90) % 2 !== 0
        return { width: swap ? height : width, height: swap ? width : height }
    }
    function calculateMaxCenteredCropFrame(width, height, aspectRatio) {
        const imageAspectRatio = width / height
        let cropWidth
        let cropHeight
        if (imageAspectRatio > aspectRatio) {
            cropWidth = Math.round(height * aspectRatio)
            cropHeight = height
        } else {
            cropWidth = width
            cropHeight = Math.round(width / aspectRatio)
        }
        const cropX = Math.round((width - cropWidth) / 2)
        const cropY = Math.round((height - cropHeight) / 2)
        if (cropX + cropWidth > width) {
            cropWidth = width - cropX
        }
        if (cropY + cropHeight > height) {
            cropHeight = height - cropY
        }
        return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
    }
    function roundRect(rect) {
        return {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
        }
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max)
    }

    // src/blocks/CloudImageEditor/src/lib/parseCropPreset.ts
    var EXCLUDED_TYPES = ["free"]
    var parseCropPreset = (cropPreset) => {
        const items = stringToArray(cropPreset)
        if (!items || items.length === 0) return []
        const result = []
        for (const item of items) {
            const raw = item.trim()
            if (!raw) continue
            const sep = raw.indexOf(":")
            if (sep === -1 && !EXCLUDED_TYPES.includes(raw)) {
                console.warn(`Invalid crop preset: ${raw}`)
                continue
            }
            const w2 = Number(raw.slice(0, sep))
            const h8 = Number(raw.slice(sep + 1))
            if (
                (!Number.isFinite(w2) ||
                    !Number.isFinite(h8) ||
                    w2 <= 0 ||
                    h8 <= 0) &&
                !EXCLUDED_TYPES.includes(raw)
            ) {
                console.warn(`Invalid crop preset: ${raw}`)
                continue
            }
            result.push({
                id: UID.generateFastUid(),
                type: "aspect-ratio",
                width: EXCLUDED_TYPES.includes(raw) ? 0 : w2,
                height: EXCLUDED_TYPES.includes(raw) ? 0 : h8,
                hasFreeform: EXCLUDED_TYPES.includes(raw),
            })
        }
        return result
    }
    var getClosestAspectRatio = (width, height, ratios, tolerance = 0.1) => {
        const inputRatio = width / height
        let closest = null
        let minDiff = Infinity
        for (const r8 of ratios) {
            const [w2, h8] = [r8.width, r8.height]
            const ratio = w2 / h8
            const diff = Math.abs(inputRatio - ratio)
            if (diff < minDiff) {
                minDiff = diff
                closest = r8
            }
        }
        if (closest) {
            const [cw, ch] = [closest.width, closest.height]
            const closestRatio = cw / ch
            const relDiff = Math.abs(inputRatio - closestRatio) / closestRatio
            if (relDiff > tolerance) {
                return null
            }
        }
        return closest
    }

    // src/utils/userAgent.ts
    function customUserAgent(options) {
        return getUserAgent$1({
            ...options,
            libraryName: PACKAGE_NAME,
            libraryVersion: PACKAGE_VERSION,
        })
    }

    // src/lit/LitActivityBlock.ts
    var ACTIVE_ATTR = "active"
    var ACTIVE_PROP = "___ACTIVITY_IS_ACTIVE___"
    var _a
    var LitActivityBlock = class _LitActivityBlock extends ((_a = LitBlock),
    _a) {
        constructor() {
            super(...arguments)
            this.historyTracked = false
            this.activityType = null
            this.init$ = activityBlockCtx(this)
            this.hj = debounce(this.ij.bind(this), 10)
        }
        Qf() {
            const actDesc = _LitActivityBlock.Db.get(this)
            this[ACTIVE_PROP] = false
            this.removeAttribute(ACTIVE_ATTR)
            actDesc?.deactivateCallback?.()
        }
        jj() {
            const actDesc = _LitActivityBlock.Db.get(this)
            this.$["*historyBack"] = this.historyBack.bind(this)
            this[ACTIVE_PROP] = true
            this.setAttribute(ACTIVE_ATTR, "")
            actDesc?.activateCallback?.()
            this.hj()
            this.emit(EventType.ACTIVITY_CHANGE, {
                activity: this.activityType,
            })
        }
        // must match visibility of base class
        initCallback() {
            super.initCallback()
            if (this.activityType) {
                if (!this.hasAttribute("activity")) {
                    this.setAttribute("activity", this.activityType)
                }
                this.sub("*currentActivity", (val) => {
                    try {
                        if (this.activityType !== val && this[ACTIVE_PROP]) {
                            this.Qf()
                        } else if (
                            this.activityType === val &&
                            !this[ACTIVE_PROP]
                        ) {
                            this.jj()
                        }
                    } catch (err) {
                        this.telemetryManager.sendEventError(
                            err,
                            `activity "${this.activityType}"`
                        )
                        console.error(
                            `Error in activity "${this.activityType}". `,
                            err
                        )
                        const nextActivity =
                            this.$["*history"][this.$["*history"].length - 1]
                        this.$["*currentActivity"] = nextActivity ?? null
                    }
                    if (!val) {
                        this.$["*history"] = []
                    }
                })
            }
        }
        ij() {
            let history = this.$["*history"]
            if (history) {
                if (history.length > 10) {
                    history = history.slice(
                        history.length - 11,
                        history.length - 1
                    )
                }
                if (
                    this.historyTracked &&
                    history[history.length - 1] !== this.activityType
                ) {
                    history.push(this.activityType)
                }
                this.$["*history"] = history
            }
        }
        Rf() {
            return !!this.activityType && _LitActivityBlock.Db.has(this)
        }
        static {
            this.Db = /* @__PURE__ */ new Map()
        }
        get isActivityActive() {
            return !!this[ACTIVE_PROP]
        }
        get couldOpenActivity() {
            return true
        }
        /** TODO: remove name argument */
        registerActivity(_name, options = {}) {
            const { onActivate, onDeactivate } = options
            _LitActivityBlock.Db.set(this, {
                activateCallback: onActivate,
                deactivateCallback: onDeactivate,
            })
        }
        kj() {
            if (this.isActivityActive) {
                this.Qf()
            }
            _LitActivityBlock.Db.delete(this)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.Rf() && this.kj()
        }
        get activityParams() {
            return this.$["*currentActivityParams"]
        }
        get initActivity() {
            return this.getCssData("--cfg-init-activity") ?? null
        }
        get doneActivity() {
            return this.getCssData("--cfg-done-activity") ?? null
        }
        historyBack() {
            const history = this.$["*history"]
            if (history) {
                let nextActivity = history.pop()
                while (nextActivity === this.activityType) {
                    nextActivity = history.pop()
                }
                let couldOpenActivity = !!nextActivity
                if (nextActivity) {
                    const nextLitActivityBlock = [...this.blocksRegistry].find(
                        (block) => block.activityType === nextActivity
                    )
                    couldOpenActivity =
                        nextLitActivityBlock?.couldOpenActivity ?? false
                }
                nextActivity = couldOpenActivity ? nextActivity : null
                this.$["*currentActivity"] = nextActivity ?? null
                if (nextActivity) this.modalManager?.open(nextActivity)
                this.$["*history"] = history
                if (!nextActivity) {
                    this.modalManager?.closeAll()
                }
            }
        }
    }
    LitActivityBlock.activities = ACTIVITY_TYPES

    // src/lit/LitUploaderBlock.ts
    var LitUploaderBlock = class _LitUploaderBlock extends LitActivityBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = false
            this.vc = false
            this.init$ = uploaderBlockCtx(this)
            this.Jd = debounce(async () => {
                const data = this.getOutputData()
                if (data.length !== this.uploadCollection.size) {
                    return
                }
                const collectionState = this.api.getOutputCollectionState()
                this.$["*collectionState"] = collectionState
                this.emit(
                    EventType.CHANGE,
                    () => this.api.getOutputCollectionState(),
                    {
                        debounce: true,
                    }
                )
                if (
                    this.cfg.groupOutput &&
                    collectionState.totalCount > 0 &&
                    collectionState.status === "success"
                ) {
                    this.pj(collectionState)
                }
            }, 300)
            this.nj = (entries, added, removed) => {
                if (!this.isConnected) return
                if (added.size || removed.size) {
                    this.$["*groupInfo"] = null
                }
                this.validationManager.runFileValidators(
                    "add",
                    [...added].map((e11) => e11.uid)
                )
                for (const entry of added) {
                    if (!entry.getValue("silent")) {
                        this.emit(
                            EventType.FILE_ADDED,
                            this.api.getOutputItem(entry.uid)
                        )
                    }
                    void this.a
                        .wait("pluginManager")
                        .then((pluginManager) =>
                            pluginManager.runOnAddHooks(entry)
                        )
                }
                this.validationManager.runCollectionValidators()
                for (const entry of removed) {
                    this.$["*uploadTrigger"].delete(entry.uid)
                    this.validationManager.cleanupValidationForEntry(entry)
                    entry.getValue("abortController")?.abort()
                    entry.setMultipleValues({
                        isRemoved: true,
                        abortController: null,
                        isUploading: false,
                        uploadProgress: 0,
                    })
                    const thumbUrl = entry?.getValue("thumbUrl")
                    thumbUrl && URL.revokeObjectURL(thumbUrl)
                    this.emit(
                        EventType.FILE_REMOVED,
                        this.api.getOutputItem(entry.uid)
                    )
                }
                this.$["*uploadList"] = entries.map((uid) => {
                    return { uid }
                })
                this.Uf()
                this.Jd()
            }
            this.oj = (changeMap) => {
                if (!this.isConnected) return
                this.Jd()
                const uploadCollection = this.uploadCollection
                const entriesToRunValidation = [
                    ...new Set(
                        Object.entries(changeMap)
                            .filter(([key]) =>
                                [
                                    "file",
                                    "uploadError",
                                    "fileInfo",
                                    "cdnUrl",
                                    "cdnUrlModifiers",
                                ].includes(key)
                            )
                            .flatMap(([, ids]) => [...ids])
                    ),
                ]
                entriesToRunValidation.length > 0 &&
                    setTimeout(() => {
                        if (!this.isConnected) return
                        const entriesToRunOnUpload =
                            entriesToRunValidation.filter(
                                (entryId) =>
                                    changeMap.fileInfo?.has(entryId) &&
                                    !!PubSub.getCtx(entryId)?.store.fileInfo
                            )
                        if (entriesToRunOnUpload.length > 0) {
                            this.validationManager.runFileValidators(
                                "upload",
                                entriesToRunOnUpload
                            )
                        }
                        this.validationManager.runFileValidators(
                            "change",
                            entriesToRunValidation
                        )
                    })
                if (changeMap.uploadProgress) {
                    for (const entryId of changeMap.uploadProgress) {
                        const ctx = PubSub.getCtx(entryId)
                        if (!ctx) continue
                        const { isUploading, silent } = ctx.store
                        if (isUploading && !silent) {
                            this.emit(
                                EventType.FILE_UPLOAD_PROGRESS,
                                this.api.getOutputItem(entryId)
                            )
                        }
                    }
                    this.Uf()
                }
                if (changeMap.isUploading) {
                    for (const entryId of changeMap.isUploading) {
                        const ctx = PubSub.getCtx(entryId)
                        if (!ctx) continue
                        const { isUploading, silent } = ctx.store
                        if (isUploading && !silent) {
                            this.emit(
                                EventType.FILE_UPLOAD_START,
                                this.api.getOutputItem(entryId)
                            )
                        }
                    }
                }
                if (changeMap.fileInfo) {
                    for (const entryId of changeMap.fileInfo) {
                        const ctx = PubSub.getCtx(entryId)
                        if (!ctx) continue
                        const { fileInfo, silent } = ctx.store
                        if (fileInfo && !silent) {
                            this.emit(
                                EventType.FILE_UPLOAD_SUCCESS,
                                this.api.getOutputItem(entryId)
                            )
                        }
                    }
                    if (this.cfg.cropPreset) {
                        this.qj()
                    }
                }
                if (changeMap.errors) {
                    this.validationManager.runCollectionValidators()
                    for (const entryId of changeMap.errors) {
                        const ctx = PubSub.getCtx(entryId)
                        if (!ctx) continue
                        const { errors } = ctx.store
                        if (errors.length > 0) {
                            this.emit(
                                EventType.FILE_UPLOAD_FAILED,
                                this.api.getOutputItem(entryId)
                            )
                            this.emit(
                                EventType.COMMON_UPLOAD_FAILED,
                                () => this.api.getOutputCollectionState(),
                                { debounce: true }
                            )
                        }
                    }
                    const loadedItems = uploadCollection.findItems((entry) => {
                        return !!entry.getValue("fileInfo")
                    })
                    const errorItems = uploadCollection.findItems((entry) => {
                        return entry.getValue("errors").length > 0
                    })
                    if (
                        uploadCollection.size > 0 &&
                        errorItems.length === 0 &&
                        uploadCollection.size === loadedItems.length &&
                        this.$["*collectionErrors"].length === 0
                    ) {
                        this.emit(
                            EventType.COMMON_UPLOAD_SUCCESS,
                            this.api.getOutputCollectionState()
                        )
                    }
                }
                if (changeMap.cdnUrl) {
                    const uids = [...changeMap.cdnUrl].filter((uid) => {
                        return !!this.uploadCollection
                            .read(uid)
                            ?.getValue("cdnUrl")
                    })
                    uids.forEach((uid) => {
                        this.emit(
                            EventType.FILE_URL_CHANGED,
                            this.api.getOutputItem(uid)
                        )
                    })
                    this.$["*groupInfo"] = null
                }
            }
            this.Uf = () => {
                let commonProgress = 0
                const uploadTrigger = this.$["*uploadTrigger"]
                const items = [...uploadTrigger].filter(
                    (id) => !!this.uploadCollection.read(id)
                )
                items.forEach((id) => {
                    const uploadProgress = this.uploadCollection.readProp(
                        id,
                        "uploadProgress"
                    )
                    if (typeof uploadProgress === "number") {
                        commonProgress += uploadProgress
                    }
                })
                const progress = items.length
                    ? Math.round(commonProgress / items.length)
                    : 0
                if (this.$["*commonProgress"] === progress) {
                    return
                }
                this.$["*commonProgress"] = progress
                this.emit(
                    EventType.COMMON_UPLOAD_PROGRESS,
                    this.api.getOutputCollectionState()
                )
            }
        }
        get lj() {
            return this.hasBlockInCtx((block) => {
                if (block instanceof _LitUploaderBlock) {
                    return block.vc && block.isConnected && block !== this
                }
                return false
            })
        }
        initCallback() {
            super.initCallback()
            this.S("*uploadCollection", () => {
                return new TypedCollection({
                    initialValue: initialUploadEntryData,
                    watchList: [
                        "file",
                        "uploadProgress",
                        "uploadError",
                        "fileInfo",
                        "errors",
                        "cdnUrl",
                        "isUploading",
                        "isValidationPending",
                    ],
                })
            })
            this.S(
                "*secureUploadsManager",
                (sharedInstancesBag) =>
                    new SecureUploadsManager(sharedInstancesBag)
            )
            this.S(
                "*validationManager",
                (sharedInstancesBag) =>
                    new ValidationManager(sharedInstancesBag)
            )
            this.S(
                "*publicApi",
                (sharedInstancesBag) =>
                    new UploaderPublicApi(sharedInstancesBag)
            )
            if (!this.lj && this.couldBeCtxOwner) {
                this.mj()
            }
        }
        getAPI() {
            return this.api
        }
        get validationManager() {
            return this.X("*validationManager")
        }
        get api() {
            return this.X("*publicApi")
        }
        get uploadCollection() {
            return this.X("*uploadCollection")
        }
        get secureUploadsManager() {
            return this.X("*secureUploadsManager")
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            if (this.vc) {
                this.Sf()
            }
            this.Jd.cancel()
        }
        connectedCallback() {
            super.connectedCallback()
            if (this.vc) {
                this.Tf()
            }
        }
        mj() {
            this.vc = true
            this.Tf()
            this.subConfigValue("maxConcurrentRequests", (value) => {
                this.$["*uploadQueue"].concurrency = Number(value) || 1
            })
        }
        Tf() {
            this.Sf()
            this.Hd = this.uploadCollection.observeCollection(this.nj)
            this.Id = this.uploadCollection.observeProperties(this.oj)
        }
        Sf() {
            this.Id?.()
            this.Hd?.()
            this.Id = void 0
            this.Hd = void 0
        }
        async pj(collectionState) {
            const uploadClientOptions = await this.getUploadClientOptions()
            const uuidList = collectionState.allEntries.map((entry) => {
                return (
                    entry.uuid +
                    (entry.cdnUrlModifiers ? `/${entry.cdnUrlModifiers}` : "")
                )
            })
            const abortController = new AbortController()
            const resp = await uploadFileGroup(uuidList, {
                ...uploadClientOptions,
                signal: abortController.signal,
            })
            if (this.$["*collectionState"] !== collectionState) {
                abortController.abort()
                return
            }
            this.$["*groupInfo"] = resp
            const collectionStateWithGroup = this.api.getOutputCollectionState()
            this.emit(EventType.GROUP_CREATED, collectionStateWithGroup)
            this.emit(
                EventType.CHANGE,
                () => this.api.getOutputCollectionState(),
                {
                    debounce: true,
                }
            )
            this.$["*collectionState"] = collectionStateWithGroup
        }
        qj() {
            const cropPreset = parseCropPreset(this.cfg.cropPreset)
            if (!cropPreset) return
            const [aspectRatioPreset] = cropPreset
            const entries = this.uploadCollection
                .findItems(
                    (entry) =>
                        !!entry.getValue("fileInfo") &&
                        entry.getValue("isImage") &&
                        !entry.getValue("cdnUrlModifiers")?.includes("/crop/")
                )
                .map((id) => this.uploadCollection.read(id))
                .filter(Boolean)
            for (const entry of entries) {
                const fileInfo = entry.getValue("fileInfo")
                if (!fileInfo || !fileInfo.imageInfo) {
                    console.warn(
                        "Failed to get image info for entry",
                        entry.uid
                    )
                    continue
                }
                const { width, height } = fileInfo.imageInfo
                const expectedAspectRatio =
                    typeof aspectRatioPreset?.width === "number" &&
                    typeof aspectRatioPreset?.height === "number" &&
                    aspectRatioPreset.width > 0 &&
                    aspectRatioPreset.height > 0
                        ? aspectRatioPreset.width / aspectRatioPreset.height
                        : 1
                const crop = calculateMaxCenteredCropFrame(
                    width,
                    height,
                    expectedAspectRatio
                )
                const cdnUrlModifiers = createCdnUrlModifiers(
                    `crop/${crop.width}x${crop.height}/${crop.x},${crop.y}`,
                    "preview"
                )
                const cdnUrl = entry.getValue("cdnUrl")
                if (!cdnUrl) {
                    console.warn("Failed to get cdnUrl for entry", entry.uid)
                    continue
                }
                entry.setMultipleValues({
                    cdnUrlModifiers,
                    cdnUrl: createCdnUrl(cdnUrl, cdnUrlModifiers),
                })
            }
        }
        async getMetadataFor(entryId) {
            const configValue = this.cfg.metadata || void 0
            if (typeof configValue === "function") {
                const outputFileEntry = this.api.getOutputItem(entryId)
                const metadata = await configValue(outputFileEntry)
                return metadata
            }
            return configValue
        }
        async getTagsFor(entryId) {
            const configValue = this.cfg.tags || void 0
            if (typeof configValue === "function") {
                const outputFileEntry = this.api.getOutputItem(entryId)
                const tags = await configValue(outputFileEntry)
                return tags
            }
            return configValue
        }
        async getUploadClientOptions() {
            const secureToken = await this.secureUploadsManager
                .getSecureToken()
                .catch(() => null)
            const options = {
                store: this.cfg.store,
                publicKey: this.cfg.pubkey,
                baseCDN: this.cfg.cdnCname,
                baseURL: this.cfg.baseUrl,
                userAgent: customUserAgent,
                integration: this.cfg.userAgentIntegration,
                secureSignature: secureToken?.secureSignature,
                secureExpire: secureToken?.secureExpire,
                retryThrottledRequestMaxTimes:
                    this.cfg.retryThrottledRequestMaxTimes,
                retryNetworkErrorMaxTimes: this.cfg.retryNetworkErrorMaxTimes,
                multipartMinFileSize: this.cfg.multipartMinFileSize,
                multipartChunkSize: this.cfg.multipartChunkSize,
                maxConcurrentRequests: this.cfg.multipartMaxConcurrentRequests,
                multipartMaxAttempts: this.cfg.multipartMaxAttempts,
                checkForUrlDuplicates: !!this.cfg.checkForUrlDuplicates,
                saveUrlForRecurrentUploads:
                    !!this.cfg.saveUrlForRecurrentUploads,
            }
            return options
        }
        getOutputData() {
            return getOutputData(this.a)
        }
    }
    LitUploaderBlock.extSrcList = Object.freeze({
        ...ExternalUploadSource,
    })
    LitUploaderBlock.sourceTypes = Object.freeze({
        ...UploadSource,
    })

    // src/blocks/Icon/Icon.ts
    var Icon = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.name = ""
            this.wc = ""
            this.Eb = null
            this.Vf = null
        }
        initCallback() {
            super.initCallback()
            this.setAttribute("aria-hidden", "true")
            this.subConfigValue("iconHrefResolver", (resolver) => {
                this.Vf = resolver
                this.Kd()
            })
            const pluginManager = this.a.pluginManager
            if (pluginManager?.onPluginsChange) {
                this.w = pluginManager.onPluginsChange(() => this.Kd())
            }
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (changedProperties.has("name")) {
                this.Kd()
            }
        }
        Kd() {
            if (!this.name) {
                this.wc = ""
                this.Eb = null
                return
            }
            const pluginManager = this.a.pluginManager
            const pluginIcon = pluginManager
                ?.snapshot()
                .icons.find((icon) => icon.name === this.name)
            if (pluginIcon) {
                this.Eb = pluginIcon.svg
                this.wc = ""
                return
            }
            this.Eb = null
            const defaultHref = `#uc-icon-${this.name}`
            const customHref = this.Vf?.(this.name)
            this.wc = customHref ?? defaultHref
        }
        render() {
            if (this.Eb) {
                return b2`${this.yield("", b2`${o8(this.Eb)}`)}`
            }
            return b2`
      ${this.yield(
          "",
          b2`<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <use href=${this.wc}></use>
      </svg>`
      )}
    `
        }
        disconnectedCallback() {
            this.w?.()
            this.w = void 0
            super.disconnectedCallback()
        }
    }
    __decorateClass([n5({ type: String })], Icon.prototype, "name", 2)
    __decorateClass([r5()], Icon.prototype, /* @__KEY__ */ "wc", 2)
    __decorateClass([r5()], Icon.prototype, /* @__KEY__ */ "Eb", 2)

    // src/utils/uniqueArray.ts
    var uniqueArray = (arr) => {
        return [...new Set(arr)]
    }

    // src/blocks/Img/configurations.ts
    var CSS_PREF = "--uc-img-"
    var UNRESOLVED_ATTR = "unresolved"
    var HI_RES_K = 2
    var ULTRA_RES_K = 3
    var DEV_MODE =
        !window.location.host.trim() ||
        window.location.host.includes(":") ||
        window.location.hostname.includes("localhost")
    var MAX_WIDTH = 3e3
    var MAX_WIDTH_JPG = 5e3
    var ImgTypeEnum = Object.freeze({
        PREVIEW: "PREVIEW",
        MAIN: "MAIN",
    })

    // src/blocks/Img/props-map.ts
    var DEFAULT_CDN_BASE = "https://ucarecdn.com"
    var PROPS_MAP = Object.freeze({
        "dev-mode": {},
        pubkey: {},
        uuid: {},
        src: {},
        // alt: {},
        // 'placeholder-src': {}, // available via CSS
        lazy: {
            default: 1,
        },
        intersection: {},
        breakpoints: {
            // '200, 300, 400'
        },
        "cdn-cname": {
            default: DEFAULT_CDN_BASE,
        },
        "proxy-cname": {},
        "secure-delivery-proxy": {},
        "hi-res-support": {
            default: 1,
        },
        "ultra-res-support": {},
        // ?
        format: {},
        "cdn-operations": {},
        progressive: {},
        quality: {},
        "is-background-for": {},
        "is-preview-blur": {
            default: 1,
        },
    })

    // src/blocks/Img/ImgConfig.ts
    var ImgConfig = class extends CssDataMixin(RegisterableElementMixin(i4)) {
        constructor() {
            super()
            this.hb = {}
            this.i = /* @__PURE__ */ new Map()
            this.ib = null
            this.xc = null
            for (const prop in PROPS_MAP) {
                const config2 = PROPS_MAP[prop]
                this.hb[CSS_PREF + prop] = config2?.default || ""
            }
        }
        createRenderRoot() {
            return this
        }
        $$(key) {
            return this.hb[CSS_PREF + key]
        }
        set$$(kvObj) {
            for (const key in kvObj) {
                const fullKey = CSS_PREF + key
                const val = kvObj[key]
                this.hb[fullKey] = val
                this.Q(fullKey, val)
            }
        }
        sub$$(key, kbFn) {
            const fullKey = CSS_PREF + key
            if (!this.i.has(fullKey)) {
                this.i.set(fullKey, /* @__PURE__ */ new Set())
            }
            this.i.get(fullKey)?.add(kbFn)
            const currentVal = this.hb[fullKey]
            if (currentVal !== null && currentVal !== "") {
                kbFn(currentVal)
            }
        }
        Q(key, val) {
            if (this.i.has(key)) {
                this.i.get(key)?.forEach((cb) => {
                    if (val === null || val === "") {
                        return
                    }
                    cb(val)
                })
            }
        }
        analyticsParams() {
            return `-/@clib/${PACKAGE_NAME}/${PACKAGE_VERSION}/uc-img/`
        }
        initAttributes(el) {
            Array.from(this.attributes).forEach((attr) => {
                const currentAttr = attr
                if (!PROPS_MAP[currentAttr.name]) {
                    el.setAttribute(currentAttr.name, currentAttr.value)
                }
            })
        }
        initIntersection(el, cbkFn) {
            const opts = {
                root: null,
                rootMargin: "0px",
            }
            this.ib = new IntersectionObserver((entries) => {
                entries.forEach((ent) => {
                    if (ent.isIntersecting) {
                        cbkFn()
                        this.ib?.unobserve(el)
                    }
                })
            }, opts)
            this.ib.observe(el)
            if (!this.xc) {
                this.xc = /* @__PURE__ */ new Set()
            }
            this.xc.add(el)
        }
        connectedCallback() {
            super.connectedCallback()
            this.rj()
        }
        rj() {
            for (const prop in PROPS_MAP) {
                const fullKey = CSS_PREF + prop
                const val = this.getCssData(fullKey, true)
                if (val !== null && val !== void 0) {
                    this.hb[fullKey] = val
                }
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            if (this.ib) {
                this.xc?.forEach((el) => {
                    this.ib?.unobserve(el)
                })
                this.ib = null
            }
            this.i.clear()
        }
        static get observedAttributes() {
            return Object.keys(PROPS_MAP)
        }
        attributeChangedCallback(name, _oldVal, newVal) {
            window.setTimeout(() => {
                const fullKey = CSS_PREF + name
                this.hb[fullKey] = newVal
                this.Q(fullKey, newVal)
            })
        }
    }

    // src/blocks/Img/utils/parseObjectToString.ts
    var parseObjectToString = (params) =>
        Object.entries(params)
            .filter(([_2, value]) => value !== void 0 && value !== "")
            .map(([key, value]) => {
                if (key === "cdn-operations") {
                    return value
                }
                if (key === "analytics") {
                    return value
                }
                return `${key}/${value}`
            })

    // src/blocks/Img/ImgBase.ts
    var ImgBase = class extends ImgConfig {
        constructor() {
            super(...arguments)
            this.ra = new Image()
            this.na = new Image()
        }
        Wf(src) {
            const isRel = !src.includes("//")
            if (isRel && !DEV_MODE) {
                src = new URL(src, document.baseURI).href
            }
            return src
        }
        yc(size) {
            if (!size) {
                return void 0
            }
            const ensuredSize = size
            const numericPart = ensuredSize.match(/\d+/)?.[0]
            const alphabeticPart = ensuredSize.match(/[a-zA-Z]+/)?.[0]
            if (!numericPart || !alphabeticPart) {
                return void 0
            }
            const bp = parseInt(numericPart, 10)
            if (Number(bp) > MAX_WIDTH_JPG && this.Xf) {
                return MAX_WIDTH_JPG + alphabeticPart
            } else if (Number(bp) > MAX_WIDTH && !this.Xf) {
                return MAX_WIDTH + alphabeticPart
            }
            return size
        }
        sj(size, blur) {
            const params = {
                format: this.Ld("format"),
                quality: this.Ld("quality"),
                resize: this.yc(size),
                blur,
                "cdn-operations": this.Ld("cdn-operations") ?? void 0,
                analytics: this.analyticsParams(),
            }
            return createCdnUrlModifiers(...parseObjectToString(params))
        }
        Ld(key) {
            const value = this.$$(key)
            if (value === null || value === void 0) {
                return value
            }
            if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
            ) {
                return value
            }
            return void 0
        }
        ea(size = "", blur = "") {
            const src = this.$$("src")
            if (src.startsWith("data:") || src.startsWith("blob:")) {
                return src
            }
            if (DEV_MODE && src && !src.includes("//")) {
                return this.Fb(src)
            }
            const cdnModifiers = this.sj(size, blur)
            const cdnCnameRaw = this.$$("cdn-cname")
            const cdnCname = cdnCnameRaw
            if (src.startsWith(String(cdnCnameRaw))) {
                return createCdnUrl(src, cdnModifiers)
            }
            const uuid = this.$$("uuid")
            if (cdnCname && uuid) {
                return this.Fb(
                    createCdnUrl(
                        createOriginalUrl(cdnCname, uuid),
                        cdnModifiers
                    )
                )
            }
            if (uuid) {
                return this.Fb(
                    createCdnUrl(
                        createOriginalUrl(cdnCname, uuid),
                        cdnModifiers
                    )
                )
            }
            const proxyCname = this.$$("proxy-cname")
            if (proxyCname) {
                return this.Fb(
                    createCdnUrl(proxyCname, cdnModifiers, this.Wf(src))
                )
            }
            const pubkey = this.$$("pubkey")
            if (pubkey) {
                return this.Fb(
                    createCdnUrl(
                        `https://${pubkey}.ucr.io/`,
                        cdnModifiers,
                        this.Wf(src)
                    )
                )
            }
            return void 0
        }
        Fb(url) {
            const previewProxy = this.$$("secure-delivery-proxy")
            if (!previewProxy) {
                return url
            }
            return applyTemplateData(
                previewProxy,
                { previewUrl: url },
                { transform: (value) => window.encodeURIComponent(value) }
            )
        }
        jb(el, k2 = 1, wOnly = true) {
            const rect = el.getBoundingClientRect()
            const w2 = k2 * Math.round(rect.width)
            const h8 = wOnly ? "" : k2 * Math.round(rect.height)
            if (w2 || h8) {
                return `${w2 ? w2 : ""}x${h8 ? h8 : ""}`
            } else {
                return null
            }
        }
        tj(img) {
            const proxifyEvent = (e11) => {
                e11.stopPropagation()
                const event = new Event(e11.type, e11)
                this.dispatchEvent(event)
            }
            const EVENTS = ["load", "error"]
            for (const event of EVENTS) {
                img.addEventListener(event, proxifyEvent)
            }
        }
        get img() {
            if (!this.sa) {
                this.Md({ elNode: this.ra })
                this.appendChild(this.ra)
            }
            return this.ra
        }
        get zc() {
            return this.sa
                ? {
                      type: ImgTypeEnum.PREVIEW,
                      img: this.na,
                  }
                : {
                      type: ImgTypeEnum.MAIN,
                      img: this.img,
                  }
        }
        get sa() {
            return this.$$("is-preview-blur")
        }
        get Yf() {
            return this.$$("is-background-for")
        }
        get Zf() {
            const breakpointsValue = this.$$("breakpoints")
            if (breakpointsValue) {
                const list = stringToArray(breakpointsValue)
                return uniqueArray(list.map((bp) => parseInt(bp, 10)))
            } else {
                return null
            }
        }
        get Xf() {
            return this.$$("format").toLowerCase() === "jpeg"
        }
        _f(el) {
            const imgSet = /* @__PURE__ */ new Set()
            imgSet.add(`url("${this.ea(this.jb(el))}") 1x`)
            if (this.$$("hi-res-support")) {
                imgSet.add(
                    `url("${this.ea(this.jb(el, HI_RES_K))}") ${HI_RES_K}x`
                )
            }
            if (this.$$("ultra-res-support")) {
                imgSet.add(
                    `url("${this.ea(this.jb(el, ULTRA_RES_K))}") ${ULTRA_RES_K}x`
                )
            }
            const iSet = `image-set(${[...imgSet].join(", ")})`
            el.style.setProperty("background-image", iSet)
            el.style.setProperty("background-image", `-webkit-${iSet}`)
        }
        $f() {
            const srcset = /* @__PURE__ */ new Set()
            if (this.Zf) {
                this.Zf.forEach((bp) => {
                    srcset.add(`${this.ea(`${bp}x`)} ${this.yc(`${bp}w`)}`)
                    if (this.$$("hi-res-support")) {
                        srcset.add(
                            `${this.ea(`${bp * HI_RES_K}x`)} ${this.yc(`${bp * HI_RES_K}w`)}`
                        )
                    }
                    if (this.$$("ultra-res-support")) {
                        srcset.add(
                            `${this.ea(`${bp * ULTRA_RES_K}x`)} ${this.yc(`${bp * ULTRA_RES_K}w`)}`
                        )
                    }
                })
            } else {
                srcset.add(`${this.ea(this.jb(this.zc.img))} 1x`)
                if (this.$$("hi-res-support")) {
                    srcset.add(`${this.ea(this.jb(this.zc.img, 2))} 2x`)
                }
                if (this.$$("ultra-res-support")) {
                    srcset.add(`${this.ea(this.jb(this.zc.img, 3))} 3x`)
                }
            }
            return [...srcset].join()
        }
        ag() {
            return this.ea()
        }
        get bg() {
            return this.ea("100x", "100")
        }
        uj() {
            const selector = this.Yf
            ;[...document.querySelectorAll(selector)].forEach((el) => {
                if (this.$$("intersection")) {
                    this.initIntersection(el, () => {
                        this._f(el)
                    })
                } else {
                    this._f(el)
                }
            })
        }
        vj({ elNode, src, srcset }) {
            if (src) {
                elNode.src = src
            }
            if (srcset) {
                elNode.srcset = srcset
            }
        }
        Md({ elNode }) {
            this.tj(elNode)
            this.initAttributes(elNode)
        }
        Nd({ src, srcset, elNode }) {
            return new Promise((resolve, reject) => {
                this.Md({ elNode })
                elNode.setAttribute(UNRESOLVED_ATTR, "")
                elNode.addEventListener("load", () => {
                    elNode.removeAttribute(UNRESOLVED_ATTR)
                    resolve(elNode)
                })
                elNode.addEventListener("error", () => {
                    reject(false)
                })
                this.vj({
                    elNode,
                    src,
                    srcset,
                })
            })
        }
        async wj() {
            if (this.$$("intersection")) {
                if (this.sa) {
                    this.Md({ elNode: this.na })
                    this.appendChild(this.na)
                }
                this.initIntersection(this.zc.img, async () => {
                    if (this.sa) {
                        this.na.src = this.bg
                    }
                    try {
                        await this.Nd({
                            src: this.ag(),
                            srcset: this.$f(),
                            elNode: this.ra,
                        })
                        if (this.sa) {
                            await this.na.remove()
                        }
                        this.appendChild(this.ra)
                    } catch {
                        if (this.sa) {
                            await this.na?.remove()
                        }
                        this.appendChild(this.ra)
                    }
                })
                return
            }
            try {
                if (this.sa) {
                    await this.Nd({
                        src: this.bg,
                        elNode: this.na,
                    })
                    this.appendChild(this.na)
                }
                await this.Nd({
                    src: this.ag(),
                    srcset: this.$f(),
                    elNode: this.ra,
                })
                if (this.sa) {
                    await this.na?.remove()
                }
                this.appendChild(this.ra)
            } catch {
                if (this.sa) {
                    await this.na?.remove()
                }
                this.appendChild(this.ra)
            }
        }
        init() {
            if (this.Yf) {
                this.uj()
            } else {
                this.wj()
            }
        }
    }

    // src/blocks/Img/Img.ts
    var Img = class extends ImgBase {
        connectedCallback() {
            super.connectedCallback()
            this.sub$$("src", () => {
                this.init()
            })
            this.sub$$("uuid", () => {
                this.init()
            })
            this.sub$$("lazy", (val) => {
                if (
                    !this.$$("is-background-for") &&
                    !this.$$("is-preview-blur")
                ) {
                    this.img.loading = val ? "lazy" : "eager"
                }
            })
        }
    }

    // node_modules/lit-html/directive-helpers.js
    var { I: t6 } = j
    var i9 = (o14) => o14
    var l4 = (o14, t7) => void 0 !== o14?.va
    var d4 = (o14) => null != o14?.va?.h
    var r6 = (o14) => void 0 === o14.strings
    var s8 = () => document.createComment("")
    var v2 = (o14, n10, e11) => {
        const l5 = o14.pa.parentNode,
            d7 = void 0 === n10 ? o14.Za : n10.pa
        if (void 0 === e11) {
            const i12 = l5.insertBefore(s8(), d7),
                n11 = l5.insertBefore(s8(), d7)
            e11 = new t6(i12, n11, o14, o14.options)
        } else {
            const t7 = e11.Za.nextSibling,
                n11 = e11.n,
                c11 = n11 !== o14
            if (c11) {
                let t8
                ;(e11.xj?.(o14),
                    (e11.n = o14),
                    void 0 !== e11.bc && (t8 = o14.W) !== n11.W && e11.bc(t8))
            }
            if (t7 !== d7 || c11) {
                let o15 = e11.pa
                for (; o15 !== t7; ) {
                    const t8 = i9(o15).nextSibling
                    ;(i9(l5).insertBefore(o15, d7), (o15 = t8))
                }
            }
        }
        return e11
    }
    var u4 = (o14, t7, i12 = o14) => (o14.ka(t7, i12), o14)
    var m2 = {}
    var p4 = (o14, t7 = m2) => (o14.c = t7)
    var M2 = (o14) => o14.c
    var h4 = (o14) => {
        ;(o14._a(), o14.pa.remove())
    }
    var j2 = (o14) => {
        o14._a()
    }

    // node_modules/lit-html/async-directive.js
    var s9 = (i12, t7) => {
        const e11 = i12.ja
        if (void 0 === e11) return false
        for (const i13 of e11) (i13.hf?.(t7, false), s9(i13, t7))
        return true
    }
    var o9 = (i12) => {
        let t7, e11
        do {
            if (void 0 === (t7 = i12.n)) break
            ;((e11 = t7.ja), e11.delete(i12), (i12 = t7))
        } while (0 === e11?.size)
    }
    var r7 = (i12) => {
        for (let t7; (t7 = i12.n); i12 = t7) {
            let e11 = t7.ja
            if (void 0 === e11) t7.ja = e11 = /* @__PURE__ */ new Set()
            else if (e11.has(i12)) break
            ;(e11.add(i12), c7(t7))
        }
    }
    function h5(i12) {
        void 0 !== this.ja
            ? (o9(this), (this.n = i12), r7(this))
            : (this.n = i12)
    }
    function n6(i12, t7 = false, e11 = 0) {
        const r8 = this.c,
            h8 = this.ja
        if (void 0 !== h8 && 0 !== h8.size)
            if (t7)
                if (Array.isArray(r8))
                    for (let i13 = e11; i13 < r8.length; i13++)
                        (s9(r8[i13], false), o9(r8[i13]))
                else null != r8 && (s9(r8, false), o9(r8))
            else s9(this, i12)
    }
    var c7 = (i12) => {
        i12.type == t4.CHILD && ((i12.bc ??= n6), (i12.xj ??= h5))
    }
    var f5 = class extends i8 {
        constructor() {
            ;(super(...arguments), (this.ja = void 0))
        }
        nd(i12, t7, e11) {
            ;(super.nd(i12, t7, e11), r7(this), (this.isConnected = i12.W))
        }
        hf(i12, t7 = true) {
            ;(i12 !== this.isConnected &&
                ((this.isConnected = i12),
                i12 ? this.reconnected?.() : this.disconnected?.()),
                t7 && (s9(this, i12), o9(this)))
        }
        setValue(t7) {
            if (r6(this.sc)) this.sc.ka(t7, this)
            else {
                const i12 = [...this.sc.c]
                ;((i12[this.bj] = t7), this.sc.ka(i12, this, 0))
            }
        }
        disconnected() {}
        reconnected() {}
    }

    // node_modules/lit-html/directives/ref.js
    var e9 = () => new h6()
    var h6 = class {}
    var o10 = /* @__PURE__ */ new WeakMap()
    var n7 = e7(
        class extends f5 {
            render(i12) {
                return A
            }
            update(i12, [s11]) {
                const e11 = s11 !== this.G
                return (
                    e11 && void 0 !== this.G && this.rt(void 0),
                    (e11 || this.lt !== this.ct) &&
                        ((this.G = s11),
                        (this.ht = i12.options?.host),
                        this.rt((this.ct = i12.element))),
                    A
                )
            }
            rt(t7) {
                if (
                    (this.isConnected || (t7 = void 0),
                    "function" == typeof this.G)
                ) {
                    const i12 = this.ht ?? globalThis
                    let s11 = o10.get(i12)
                    ;(void 0 === s11 &&
                        ((s11 = /* @__PURE__ */ new WeakMap()),
                        o10.set(i12, s11)),
                        void 0 !== s11.get(this.G) &&
                            this.G.call(this.ht, void 0),
                        s11.set(this.G, t7),
                        void 0 !== t7 && this.G.call(this.ht, t7))
                } else this.G.value = t7
            }
            get lt() {
                return "function" == typeof this.G
                    ? o10.get(this.ht ?? globalThis)?.get(this.G)
                    : this.G?.value
            }
            disconnected() {
                this.lt === this.ct && this.rt(void 0)
            }
            reconnected() {
                this.rt(this.ct)
            }
        }
    )

    // src/blocks/Modal/Modal.ts
    var LAST_ACTIVE_MODAL_ID = null
    var Modal = class extends LitBlock {
        constructor() {
            super(...arguments)
            /** WARNING: Do not rename/change this, it's used in dashboard */
            this.dialogEl = e9()
            this.strokes = false
            this.blockBodyScrolling = false
            /** WARNING: Do not rename/change this, it's used in dashboard */
            this.closeDialog = () => {
                this.modalManager?.close(this.id)
                if (!this.modalManager?.hasActiveModals) {
                    document.body.style.overflow = ""
                    this.$["*currentActivity"] = null
                }
            }
            this.yj = () => {
                this.closeDialog()
            }
            this.zj = (e11) => {
                this.Od = e11.target
            }
            this.Aj = (e11) => {
                const target = e11.target
                if (target === this.dialogEl.value && target === this.Od) {
                    this.closeDialog()
                }
            }
            this.Gb = ({ id }) => {
                if (id === this.id) {
                    LAST_ACTIVE_MODAL_ID = id
                    this.show()
                    this.emit(
                        EventType.MODAL_OPEN,
                        { modalId: id },
                        { debounce: true }
                    )
                } else {
                    this.hide()
                }
            }
            this.Hb = ({ id }) => {
                if (id === this.id) {
                    this.hide()
                    this.emit(
                        EventType.MODAL_CLOSE,
                        {
                            modalId: id,
                            hasActiveModals: this.modalManager?.hasActiveModals,
                        },
                        { debounce: true }
                    )
                }
            }
            this.cg = (_data) => {
                this.hide()
                if (LAST_ACTIVE_MODAL_ID === this.id) {
                    this.emit(
                        EventType.MODAL_CLOSE,
                        {
                            modalId: LAST_ACTIVE_MODAL_ID,
                            hasActiveModals: this.modalManager?.hasActiveModals,
                        },
                        { debounce: true }
                    )
                }
            }
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-modal"]
        }
        async show() {
            await this.updateComplete
            const dialog = this.dialogEl.value
            if (typeof dialog.showModal === "function") {
                this.setAttribute("aria-modal", "true")
                dialog.showModal()
            } else {
                dialog.setAttribute("open", "")
            }
            if (this.cfg.modalScrollLock) {
                document.body.style.overflow = "hidden"
            }
        }
        hide() {
            const dialog = this.dialogEl.value
            if (!dialog) return
            if (typeof dialog.close === "function") {
                this.setAttribute("aria-modal", "false")
                dialog.close()
            } else {
                dialog.removeAttribute("open")
            }
        }
        initCallback() {
            super.initCallback()
            this.modalManager?.registerModal(this.id, this)
            this.subConfigValue("modalBackdropStrokes", (val) => {
                if (val) {
                    this.setAttribute("strokes", "")
                } else {
                    this.removeAttribute("strokes")
                }
            })
            this.modalManager?.subscribe(ModalEvents.OPEN, this.Gb)
            this.modalManager?.subscribe(ModalEvents.CLOSE, this.Hb)
            this.modalManager?.subscribe(ModalEvents.CLOSE_ALL, this.cg)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            document.body.style.overflow = ""
            this.Od = void 0
            this.modalManager?.unsubscribe(ModalEvents.OPEN, this.Gb)
            this.modalManager?.unsubscribe(ModalEvents.CLOSE, this.Hb)
            this.modalManager?.unsubscribe(ModalEvents.CLOSE_ALL, this.cg)
        }
        Bj(dialog) {
            this.dialogEl = { value: dialog }
            this.dialogEl.value?.addEventListener("close", this.yj)
            this.dialogEl.value?.addEventListener("mousedown", this.zj)
            this.dialogEl.value?.addEventListener("mouseup", this.Aj)
        }
        render() {
            return b2`
  <dialog ${n7(this.Bj)}>
    ${this.yield("")}
  </dialog>
`
        }
    }
    __decorateClass(
        [n5({ type: Boolean, noAccessor: true })],
        Modal.prototype,
        "strokes",
        2
    )
    __decorateClass(
        [
            n5({
                type: Boolean,
                attribute: "block-body-scrolling",
                noAccessor: true,
            }),
        ],
        Modal.prototype,
        "blockBodyScrolling",
        2
    )

    // src/blocks/FormInput/FormInput.ts
    var FormInput = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.J = null
            this.Ac = null
        }
        get dg() {
            return this.nameAttrValue ?? this.ctxName
        }
        eg() {
            const validationInput = document.createElement("input")
            validationInput.type = "text"
            validationInput.name = this.dg
            validationInput.required = this.cfg.multipleMin > 0
            validationInput.tabIndex = -1
            applyStyles(validationInput, {
                opacity: 0,
                height: 0,
                width: 0,
            })
            return validationInput
        }
        initCallback() {
            super.initCallback()
            this.J = this.eg()
            this.appendChild(this.J)
            this.sub(
                "*collectionState",
                (collectionState) => {
                    if (!collectionState) {
                        return
                    }
                    if (!this.Ac) {
                        const dynamicInputsContainer =
                            document.createElement("div")
                        this.appendChild(dynamicInputsContainer)
                        this.Ac = dynamicInputsContainer
                    }
                    if (!this.J) {
                        const input = this.eg()
                        this.appendChild(input)
                        this.J = input
                    }
                    this.Ac.innerHTML = ""
                    if (
                        collectionState.status === "uploading" ||
                        collectionState.status === "idle"
                    ) {
                        this.J.value = ""
                        this.J.setCustomValidity("")
                        return
                    }
                    if (collectionState.status === "failed") {
                        const errorMsg = collectionState.errors[0]?.message
                        this.J.value = ""
                        this.J.setCustomValidity(errorMsg ?? "")
                        return
                    }
                    const group2 = collectionState.group
                        ? collectionState.group
                        : null
                    if (group2) {
                        this.J.value = group2.cdnUrl ?? ""
                        this.J.setCustomValidity("")
                        return
                    }
                    const cdnUrls = collectionState.allEntries
                        .map((entry) => entry.cdnUrl)
                        .filter((url) => typeof url === "string")
                    if (
                        !this.cfg.multiple &&
                        cdnUrls.length === 1 &&
                        cdnUrls[0]
                    ) {
                        this.J.value = cdnUrls[0]
                        this.J.setCustomValidity("")
                        return
                    }
                    this.J.remove()
                    this.J = null
                    const fr = new DocumentFragment()
                    for (const value of cdnUrls) {
                        const input = document.createElement("input")
                        input.type = "hidden"
                        input.name = `${this.dg}[]`
                        input.value = value
                        fr.appendChild(input)
                    }
                    this.Ac.replaceChildren(fr)
                },
                false
            )
        }
    }
    __decorateClass(
        [n5({ type: String, noAccessor: true, attribute: "name" })],
        FormInput.prototype,
        "nameAttrValue",
        2
    )

    // src/blocks/Copyright/Copyright.ts
    var Copyright = class extends LitBlock {
        initCallback() {
            super.initCallback()
            this.subConfigValue("removeCopyright", (value) => {
                this.toggleAttribute("hidden", !!value)
            })
        }
        render() {
            return b2`
      <a
        href="https://uploadcare.com/?utm_source=copyright&amp;utm_medium=referral&amp;utm_campaign=v4"
        target="_blank noopener"
        class="uc-credits"
        >Powered by Uploadcare</a
      >
    `
        }
    }

    // src/blocks/ProgressBar/ProgressBar.ts
    var ProgressBar = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.hasFileName = false
            this.value = 0
            this.visible = true
            this.fa = 0
            this.Bc = e9()
            this.fg = () => {
                const fakeProgressLine = this.Bc.value
                if (!fakeProgressLine) {
                    return
                }
                if (!this.visible) {
                    fakeProgressLine.classList.add("uc-fake-progress--hidden")
                    return
                }
                if (this.fa > 0) {
                    fakeProgressLine.classList.add("uc-fake-progress--hidden")
                }
            }
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this.fa = this.Pd(this.value)
            this.Qd()
            this.Bc.value?.addEventListener("animationiteration", this.fg)
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("value")) {
                const normalizedValue = this.Pd(this.value)
                if (!this.visible) {
                    this.fa = normalizedValue
                } else {
                    const nextValue2 = Math.max(this.fa, normalizedValue)
                    if (nextValue2 !== this.fa) {
                        this.fa = nextValue2
                        this.Qd()
                    }
                }
            }
            if (changedProperties.has("visible")) {
                this.classList.toggle("uc-progress-bar--hidden", !this.visible)
                if (this.visible) {
                    this.Qd()
                } else {
                    this.fa = this.Pd(this.value)
                }
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.Bc.value?.removeEventListener("animationiteration", this.fg)
        }
        Pd(value) {
            if (!Number.isFinite(value)) {
                return 0
            }
            return Math.min(100, Math.max(0, value))
        }
        Qd() {
            if (!this.visible) {
                return
            }
            this.style.setProperty("--l-progress-value", this.fa.toString())
        }
        render() {
            return b2`
      <div ${n7(this.Bc)} class="uc-fake-progress"></div>
      <div class="uc-progress"></div>
    `
        }
    }
    __decorateClass(
        [n5({ type: Boolean, noAccessor: true })],
        ProgressBar.prototype,
        "hasFileName",
        2
    )
    __decorateClass([n5({ type: Number })], ProgressBar.prototype, "value", 2)
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        ProgressBar.prototype,
        "visible",
        2
    )

    // src/blocks/ProgressBarCommon/ProgressBarCommon.ts
    var ProgressBarCommon = class extends LitUploaderBlock {
        constructor() {
            super()
            this.oa = false
            this.kb = 0
            this.init$ = {
                ...this.init$,
                "*commonProgress": 0,
            }
        }
        initCallback() {
            super.initCallback()
            this.Rd = this.uploadCollection.observeProperties(() => {
                const anyUploading = this.uploadCollection
                    .items()
                    .some((id) => {
                        const item = this.uploadCollection.read(id)
                        return item?.getValue("isUploading") ?? false
                    })
                this.oa = anyUploading
            })
            this.sub("*commonProgress", (progress) => {
                this.kb = progress
            })
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("visible")) {
                if (this.oa) {
                    this.setAttribute("active", "")
                } else {
                    this.removeAttribute("active")
                }
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.Rd?.()
            this.Rd = void 0
        }
        render() {
            return b2` <uc-progress-bar .value=${this.kb} .visible=${this.oa}></uc-progress-bar> `
        }
    }
    __decorateClass([r5()], ProgressBarCommon.prototype, /* @__KEY__ */ "oa", 2)
    __decorateClass([r5()], ProgressBarCommon.prototype, /* @__KEY__ */ "kb", 2)

    // src/blocks/Select/Select.ts
    var Select = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.value = ""
            this.disabled = false
            this.options = []
            this.Cj = (event) => {
                if (this.disabled) {
                    event.preventDefault()
                    event.stopPropagation()
                    return
                }
                event.preventDefault()
                event.stopPropagation()
                const selectEl = event.currentTarget
                if (!selectEl) {
                    return
                }
                this.value = selectEl.value
                this.dispatchEvent(new Event("change"))
            }
        }
        render() {
            return b2`
      <select @change=${this.Cj} .value=${this.value} ?disabled=${this.disabled}>
        ${this.options.map((option) => b2`<option value=${option.value}>${option.text}</option>`)}
      </select>
    `
        }
    }
    __decorateClass(
        [n5({ type: String, attribute: false })],
        Select.prototype,
        "value",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        Select.prototype,
        "disabled",
        2
    )
    __decorateClass(
        [n5({ type: Array, attribute: false })],
        Select.prototype,
        "options",
        2
    )

    // src/blocks/SourceBtn/SourceBtn.ts
    var SourceBtn = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.textOnly = false
            this.iconOnly = false
            this.Sd = "default"
            this.Cc = ""
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (changedProperties.has("source")) {
                this.Dj(this.source)
            }
        }
        Dj(source) {
            if (!source) {
                this.Cc = ""
                this.Sd = "default"
                return
            }
            const { label, icon, id } = source
            this.Cc = label
            this.Sd = icon ?? id ?? "default"
        }
        activate() {
            if (!this.source) return
            this.telemetryManager.sendEvent({
                eventType: InternalEventType.ACTION_EVENT,
                payload: {
                    sourceId: this.source.id,
                },
            })
            void this.source.onClick()
        }
        render() {
            return b2`
      <button aria-label=${this.l10n(this.Cc)} type="button" @click=${this.activate}>
        ${this.textOnly ? "" : b2`<uc-icon name=${this.Sd}></uc-icon>`}
        ${this.iconOnly ? "" : b2`<div class="uc-txt">${this.l10n(this.Cc)}</div>`}
      </button>
    `
        }
    }
    __decorateClass(
        [n5({ attribute: false })],
        SourceBtn.prototype,
        "source",
        2
    )
    __decorateClass([n5({ type: Boolean })], SourceBtn.prototype, "textOnly", 2)
    __decorateClass([n5({ type: Boolean })], SourceBtn.prototype, "iconOnly", 2)
    __decorateClass([r5()], SourceBtn.prototype, /* @__KEY__ */ "Sd", 2)
    __decorateClass([r5()], SourceBtn.prototype, /* @__KEY__ */ "Cc", 2)

    // src/abstract/controllers/SourceListController.ts
    var SourceListController = class {
        constructor(host, options) {
            this.gg = []
            this.b = options.ctx
            this.a = options.sharedInstancesBag
            this.hg = options.onSourcesChange
            host.addController(this)
        }
        hostConnected() {
            this.Td = this.b.sub(sharedConfigKey("sourceList"), (val) => {
                this.gg = stringToArray(val)
                this.Ud()
            })
            const pluginManager = this.a.pluginManager
            if (pluginManager?.onPluginsChange) {
                this.w = pluginManager.onPluginsChange(() => this.Ud())
            }
            this.Ud()
        }
        hostDisconnected() {
            this.w?.()
            this.w = void 0
            this.Td?.()
            this.Td = void 0
        }
        Ud() {
            const pluginManager = this.a.pluginManager
            const pluginSources = pluginManager?.snapshot().sources ?? []
            const pluginSourceById = new Map(
                pluginSources.map((source) => [source.id, source])
            )
            const sources = []
            this.gg.forEach((srcName) => {
                const expanded = this.Ej(srcName, pluginSourceById)
                const expandedDiffer =
                    expanded.length !== 1 || expanded[0] !== srcName
                if (expandedDiffer) {
                    for (const name of expanded) {
                        const pluginSource2 = pluginSourceById.get(name)
                        if (pluginSource2) {
                            sources.push(this.ig(pluginSource2))
                        }
                    }
                    return
                }
                const pluginSource = pluginSourceById.get(srcName)
                if (pluginSource) {
                    sources.push(this.ig(pluginSource))
                }
            })
            this.hg(sources)
        }
        Ej(srcName, pluginSourceById) {
            const pluginSource = pluginSourceById.get(srcName)
            if (pluginSource?.expand) {
                return pluginSource.expand()
            }
            return [srcName]
        }
        ig(source) {
            return {
                id: source.id,
                label: source.label,
                icon: source.icon,
                onClick: () => source.onSelect(),
            }
        }
    }

    // src/blocks/SourceList/SourceList.ts
    var SourceList = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.r = []
            this.wrap = false
        }
        initCallback() {
            super.initCallback()
            new SourceListController(this, {
                ctx: this.a.ctx,
                sharedInstancesBag: this.a,
                onSourcesChange: (sources) => {
                    this.r = sources
                },
            })
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (this.cfg.sourceListWrap) {
                this.style.removeProperty("display")
            } else {
                this.style.display = "contents"
            }
        }
        render() {
            return b2`${this.r.map((source) => b2`<uc-source-btn role="listitem" .source=${source} data-source-id=${source.id}></uc-source-btn>`)}`
        }
    }
    __decorateClass([r5()], SourceList.prototype, /* @__KEY__ */ "r", 2)
    __decorateClass(
        [n5({ type: Boolean, attribute: "wrap", noAccessor: true })],
        SourceList.prototype,
        "wrap",
        2
    )

    // src/blocks/Spinner/Spinner.ts
    var Spinner = class extends LitBlock {
        render() {
            return b2` <div class="uc-spinner"></div> `
        }
    }

    // src/utils/transparentPixelSrc.ts
    var TRANSPARENT_PIXEL_SRC =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    // src/utils/preloadImage.ts
    function preloadImage(src) {
        const image = new Image()
        const promise = new Promise((resolve, reject) => {
            image.src = src
            image.onload = () => resolve()
            image.onerror = (err) => reject(err)
        })
        const cancel = () => {
            if (image.naturalWidth === 0) {
                image.src = TRANSPARENT_PIXEL_SRC
            }
        }
        return { promise, image, cancel }
    }
    function batchPreloadImages(list) {
        const preloaders = []
        for (const src of list) {
            const preload = preloadImage(src)
            preloaders.push(preload)
        }
        const images = preloaders.map((preload) => preload.image)
        const promise = Promise.allSettled(
            preloaders.map((preload) => preload.promise)
        )
        const cancel = () => {
            preloaders.forEach((preload) => {
                preload.cancel()
            })
        }
        return { promise, images, cancel }
    }

    // src/utils/resizeImage.ts
    function generateThumb(imgFile, size = 40) {
        if (imgFile.type === "image/svg+xml") {
            return URL.createObjectURL(imgFile)
        }
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            return Promise.reject(new Error("Canvas context not supported"))
        }
        const img = new Image()
        const promise = new Promise((resolve, reject) => {
            img.onload = () => {
                const ratio = img.height / img.width
                if (ratio > 1) {
                    canvas.width = size
                    canvas.height = size * ratio
                } else {
                    canvas.height = size
                    canvas.width = size / ratio
                }
                ctx.fillStyle = "rgb(240, 240, 240)"
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject()
                        return
                    }
                    const url = URL.createObjectURL(blob)
                    resolve(url)
                })
            }
            img.onerror = (err) => {
                reject(err)
            }
        })
        img.src = URL.createObjectURL(imgFile)
        return promise
    }

    // src/blocks/FileItem/FileItemConfig.ts
    var FileItemConfig = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.Dc = /* @__PURE__ */ new Set()
            this.entry = null
        }
        withEntry(fn) {
            return (...args) => {
                const entry = this.entry
                if (!entry) {
                    console.warn("No entry found")
                    return void 0
                }
                return fn(entry, ...args)
            }
        }
        subEntry(prop, handler) {
            this.withEntry((entry, propInner, handlerInner) => {
                const sub = entry.subscribe(propInner, (value) => {
                    if (this.isConnected) {
                        handlerInner(value)
                    }
                })
                this.Dc.add(sub)
            })(prop, handler)
        }
        reset() {
            for (const sub of this.Dc) {
                sub()
            }
            this.Dc = /* @__PURE__ */ new Set()
            this.entry = null
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.Dc = /* @__PURE__ */ new Set()
        }
    }

    // src/blocks/svg-backgrounds/svg-backgrounds.ts
    function createSvgBlobUrl(svg) {
        const blob = new Blob([svg], {
            type: "image/svg+xml",
        })
        return URL.createObjectURL(blob)
    }
    function fileCssBg(color = "hsl(209, 21%, 65%)", width = 32, height = 32) {
        return createSvgBlobUrl(
            /*svg*/
            `
  <svg width="${width}" height="${height}" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" fill="${color}" d="M9.68848 8.70068C9.68848 8.42454 9.91233 8.20068 10.1885 8.20068H15.0885C15.2211 8.20068 15.3483 8.25336 15.442 8.34713L20.342 13.2471C20.4358 13.3409 20.4885 13.4681 20.4885 13.6007V21.3007C20.4885 21.5768 20.2646 21.8007 19.9885 21.8007H10.1885C9.91233 21.8007 9.68848 21.5768 9.68848 21.3007V8.70068ZM10.6885 9.20068V20.8007H19.4885V14.1007L15.0885 14.1007C14.8123 14.1007 14.5885 13.8768 14.5885 13.6007L14.5885 9.20068H10.6885ZM15.5885 9.90779L18.7814 13.1007L15.5885 13.1007L15.5885 9.90779Z"/>
  </svg>
  `
        )
    }

    // src/blocks/Thumb/Thumb.ts
    var CDN_MAX_OUTPUT_DIMENSION = 3e3
    var Thumb = class extends FileItemConfig {
        constructor() {
            super(...arguments)
            this.badgeIcon = ""
            this.uid = ""
            this.Ba = ""
            this.jg = false
            this.Ec = null
            this.kg = false
            this.Fj = this.cfg.filesViewMode
            // biome-ignore lint/style/noInferrableTypes: Here the type is needed because `_withEntry` could not infer it correctly
            this.lg = this.withEntry(async (entry, force = false) => {
                const fileInfo = entry.getValue("fileInfo")
                const isImage = entry.getValue("isImage")
                const uuid = entry.getValue("uuid")
                const currentThumbUrl = entry.getValue("thumbUrl")
                const size = this.Gj(force)
                if (fileInfo && isImage && uuid) {
                    const thumbUrl = await this.proxyUrl(
                        createCdnUrl(
                            createOriginalUrl(this.cfg.cdnCname, uuid),
                            createCdnUrlModifiers(
                                entry.getValue("cdnUrlModifiers"),
                                `stretch/off`,
                                `scale_crop/${size}x${size}/center`
                            )
                        )
                    )
                    if (currentThumbUrl === thumbUrl) {
                        return
                    }
                    const { promise } = preloadImage(thumbUrl)
                    promise
                        .then(() => {
                            entry.setValue("thumbUrl", thumbUrl)
                            currentThumbUrl?.startsWith("blob:") &&
                                URL.revokeObjectURL(currentThumbUrl)
                        })
                        .catch(async () => {
                            if (currentThumbUrl?.startsWith("blob:")) return
                            try {
                                const file2 = entry.getValue("file")
                                if (!file2) return
                                const blobThumbUrl = await generateThumb(
                                    file2,
                                    size
                                )
                                entry.setValue("thumbUrl", blobThumbUrl)
                            } catch (err) {
                                this.telemetryManager.sendEventError(
                                    err,
                                    "thumbnail generation. Failed to generate thumb from file"
                                )
                                const color = window
                                    .getComputedStyle(this)
                                    .getPropertyValue("--uc-muted-foreground")
                                entry.setValue("thumbUrl", fileCssBg(color))
                            }
                        })
                    return
                }
                if (entry.getValue("thumbUrl")) {
                    return
                }
                const file = entry.getValue("file")
                if (file?.type.includes("image")) {
                    try {
                        const thumbUrl = await generateThumb(file, size)
                        entry.setValue("thumbUrl", thumbUrl)
                    } catch (err) {
                        this.telemetryManager.sendEventError(
                            err,
                            "thumbnail generation. Failed to generate thumb from file"
                        )
                        const color = window
                            .getComputedStyle(this)
                            .getPropertyValue("--uc-muted-foreground")
                        entry.setValue("thumbUrl", fileCssBg(color))
                    }
                } else {
                    const color = window
                        .getComputedStyle(this)
                        .getPropertyValue("--uc-muted-foreground")
                    entry.setValue("thumbUrl", fileCssBg(color))
                }
            })
            this.Fc = debounce(this.lg.bind(this), 100)
        }
        Gj(force = false) {
            if (force) {
                this.Ec = this.getBoundingClientRect()
            }
            let size = Math.max(
                parseInt(String(this?.Ec?.height || 0), 10),
                parseInt(String(this?.Ec?.width || 0), 10),
                this.cfg.thumbSize
            )
            if (window.devicePixelRatio > 1) {
                size *= window.devicePixelRatio
            }
            return Math.min(Math.round(size), CDN_MAX_OUTPUT_DIMENSION)
        }
        Hj(src, signal) {
            return new Promise((resolve, reject) => {
                let image = new Image()
                image.decoding = "async"
                const cleanup = () => {
                    if (!image) {
                        return
                    }
                    image.onload = null
                    image.onerror = null
                    image.src = TRANSPARENT_PIXEL_SRC
                    signal?.removeEventListener("abort", onAbort)
                    image = null
                }
                const onAbort = () => {
                    cleanup()
                    reject(new DOMException("Aborted", "AbortError"))
                }
                if (signal) {
                    if (signal.aborted) {
                        onAbort()
                        return
                    }
                    signal.addEventListener("abort", onAbort, { once: true })
                }
                const resolveSafe = () => {
                    cleanup()
                    resolve()
                }
                const rejectSafe = (error) => {
                    cleanup()
                    reject(error)
                }
                if (typeof image.decode === "function") {
                    image.src = src
                    image.decode().then(resolveSafe).catch(rejectSafe)
                    return
                }
                image.onload = resolveSafe
                image.onerror = rejectSafe
                image.src = src
            })
        }
        Wd() {
            this.Vd?.cancel()
            this.Vd = void 0
        }
        Ij(nextThumbUrl) {
            this.Wd()
            if (!nextThumbUrl) {
                if (this.Ba) {
                    this.Ba = ""
                }
                return
            }
            if (nextThumbUrl === this.Ba) {
                return
            }
            const abortController = new AbortController()
            const pending = {
                controller: abortController,
                cancel: () => {
                    abortController.abort()
                    if (pending.rafId !== void 0) {
                        window.cancelAnimationFrame(pending.rafId)
                    }
                },
            }
            this.Vd = pending
            this.Hj(nextThumbUrl, abortController.signal)
                .then(() => {
                    if (abortController.signal.aborted) {
                        return
                    }
                    pending.rafId = window.requestAnimationFrame(() => {
                        if (!abortController.signal.aborted) {
                            this.Ba = nextThumbUrl
                        }
                    })
                })
                .catch((error) => {
                    if (abortController.signal.aborted) {
                        return
                    }
                    if (
                        error instanceof DOMException &&
                        error.name === "AbortError"
                    ) {
                        return
                    }
                    console.warn(
                        "[Thumb] Failed to decode thumbnail image",
                        error
                    )
                })
        }
        Gc(force = false) {
            if (!this.entry) {
                return
            }
            if (force) {
                this.lg(true)
                return
            }
            if (!this.kg) {
                return
            }
            this.Fc()
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this.mg()
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("uid")) {
                this.mg()
            }
        }
        Ib(entries) {
            const [entry] = entries
            if (!entry) {
                return
            }
            this.kg = entry.isIntersecting
            if (entry.isIntersecting) {
                this.Ec = entry.boundingClientRect
                this.Gc()
                this.e?.disconnect()
            }
            if (entry.intersectionRatio === 0) {
                this.Fc.cancel()
            }
        }
        reset() {
            super.reset()
            this.Fc.cancel()
            this.Wd()
            if (this.Ba) {
                this.Ba = ""
            }
        }
        mg() {
            const id = this.uid?.trim()
            if (!id) {
                if (this.entry) {
                    this.reset()
                }
                return
            }
            const entry = this.uploadCollection?.read(id)
            if (!entry || entry === this.entry) {
                return
            }
            this.reset()
            this.entry = entry
            const requestThumb = () => {
                this.Gc()
            }
            this.subEntry("fileInfo", (fileInfo) => {
                if (fileInfo?.isImage) {
                    requestThumb()
                }
            })
            this.subEntry("thumbUrl", (thumbUrl) => {
                this.Ij(thumbUrl ?? void 0)
            })
            this.subEntry("cdnUrlModifiers", requestThumb)
            this.Gc(true)
        }
        initCallback() {
            super.initCallback()
            this.subConfigValue("filesViewMode", (viewMode) => {
                if (viewMode === "grid" && !this.jg) {
                    if (this.Fj === "list") {
                        this.Gc(true)
                    }
                    this.jg = true
                }
            })
        }
        connectedCallback() {
            super.connectedCallback()
            this.e?.disconnect()
            this.e = new window.IntersectionObserver(this.Ib.bind(this), {
                threshold: 0.1,
            })
            this.e.observe(this)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.Fc.cancel()
            this.Wd()
            this.e?.disconnect()
        }
        render() {
            return b2`
  <div class="uc-thumb">
    <img
      class="uc-thumb__img"
      src=${this.Ba || TRANSPARENT_PIXEL_SRC}
      role="img"
      alt="Preview of uploaded image"
      ?hidden=${!this.Ba}
      draggable="false"
    />
    <div class="uc-badge">
      <uc-icon name=${this.badgeIcon}></uc-icon>
    </div>
  </div>
`
        }
    }
    __decorateClass([n5({ type: String })], Thumb.prototype, "badgeIcon", 2)
    __decorateClass(
        [
            n5({
                attribute: false,
            }),
        ],
        Thumb.prototype,
        "uid",
        2
    )
    __decorateClass([r5()], Thumb.prototype, /* @__KEY__ */ "Ba", 2)

    // src/blocks/ActivityHeader/ActivityHeader.ts
    var ActivityHeader = class extends LitActivityBlock {}

    // src/blocks/StartFrom/StartFrom.ts
    var StartFrom = class extends LitActivityBlock {
        constructor() {
            super(...arguments)
            this.historyTracked = true
            this.activityType = LitActivityBlock.activities.START_FROM
        }
        initCallback() {
            super.initCallback()
            this.registerActivity(this.activityType ?? "")
        }
        render() {
            return b2` <div class="uc-content">${this.yield("")}</div> `
        }
    }

    // src/blocks/UploadCtxProvider/UploadCtxProvider.ts
    var UploadCtxProvider = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.ng = null
        }
        static {
            this.styleAttrs = ["uc-wgt-common"]
        }
        static {
            this.EventType = EventType
        }
        initCallback() {
            super.initCallback()
            this.ng = this.eventEmitter.bindTarget(this)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.ng?.()
        }
    }

    // src/utils/throttle.ts
    var throttle = (fn, wait) => {
        let inThrottle = false
        let lastFn
        let lastTime = 0
        const throttled = (...args) => {
            if (!inThrottle) {
                fn(...args)
                lastTime = Date.now()
                inThrottle = true
            } else {
                if (lastFn) clearTimeout(lastFn)
                lastFn = setTimeout(
                    () => {
                        if (Date.now() - lastTime >= wait) {
                            fn(...args)
                            lastTime = Date.now()
                        }
                    },
                    Math.max(wait - (Date.now() - lastTime), 0)
                )
            }
        }
        Object.defineProperty(throttled, "cancel", {
            configurable: false,
            writable: false,
            enumerable: false,
            value: () => {
                if (lastFn) clearTimeout(lastFn)
            },
        })
        return throttled
    }

    // node_modules/lit-html/directives/repeat.js
    var u5 = (e11, s11, t7) => {
        const r8 = /* @__PURE__ */ new Map()
        for (let l5 = s11; l5 <= t7; l5++) r8.set(e11[l5], l5)
        return r8
    }
    var c8 = e7(
        class extends i8 {
            constructor(e11) {
                if ((super(e11), e11.type !== t4.CHILD))
                    throw Error("repeat() can only be used in text expressions")
            }
            dt(e11, s11, t7) {
                let r8
                void 0 === t7 ? (t7 = s11) : void 0 !== s11 && (r8 = s11)
                const l5 = [],
                    o14 = []
                let i12 = 0
                for (const s12 of e11)
                    ((l5[i12] = r8 ? r8(s12, i12) : i12),
                        (o14[i12] = t7(s12, i12)),
                        i12++)
                return { values: o14, keys: l5 }
            }
            render(e11, s11, t7) {
                return this.dt(e11, s11, t7).values
            }
            update(s11, [t7, r8, c11]) {
                const d7 = M2(s11),
                    { values: p5, keys: a6 } = this.dt(t7, r8, c11)
                if (!Array.isArray(d7)) return ((this.ut = a6), p5)
                const h8 = (this.ut ??= []),
                    v3 = []
                let m3,
                    y4,
                    x2 = 0,
                    j3 = d7.length - 1,
                    k2 = 0,
                    w2 = p5.length - 1
                for (; x2 <= j3 && k2 <= w2; )
                    if (null === d7[x2]) x2++
                    else if (null === d7[j3]) j3--
                    else if (h8[x2] === a6[k2])
                        ((v3[k2] = u4(d7[x2], p5[k2])), x2++, k2++)
                    else if (h8[j3] === a6[w2])
                        ((v3[w2] = u4(d7[j3], p5[w2])), j3--, w2--)
                    else if (h8[x2] === a6[w2])
                        ((v3[w2] = u4(d7[x2], p5[w2])),
                            v2(s11, v3[w2 + 1], d7[x2]),
                            x2++,
                            w2--)
                    else if (h8[j3] === a6[k2])
                        ((v3[k2] = u4(d7[j3], p5[k2])),
                            v2(s11, d7[x2], d7[j3]),
                            j3--,
                            k2++)
                    else if (
                        (void 0 === m3 &&
                            ((m3 = u5(a6, k2, w2)), (y4 = u5(h8, x2, j3))),
                        m3.has(h8[x2]))
                    )
                        if (m3.has(h8[j3])) {
                            const e11 = y4.get(a6[k2]),
                                t8 = void 0 !== e11 ? d7[e11] : null
                            if (null === t8) {
                                const e12 = v2(s11, d7[x2])
                                ;(u4(e12, p5[k2]), (v3[k2] = e12))
                            } else
                                ((v3[k2] = u4(t8, p5[k2])),
                                    v2(s11, d7[x2], t8),
                                    (d7[e11] = null))
                            k2++
                        } else (h4(d7[j3]), j3--)
                    else (h4(d7[x2]), x2++)
                for (; k2 <= w2; ) {
                    const e11 = v2(s11, v3[w2 + 1])
                    ;(u4(e11, p5[k2]), (v3[k2++] = e11))
                }
                for (; x2 <= j3; ) {
                    const e11 = d7[x2++]
                    null !== e11 && h4(e11)
                }
                return ((this.ut = a6), p4(s11, v3), E)
            }
        }
    )

    // node_modules/lit-html/directives/style-map.js
    var n8 = "important"
    var i10 = " !" + n8
    var o11 = e7(
        class extends i8 {
            constructor(t7) {
                if (
                    (super(t7),
                    t7.type !== t4.ATTRIBUTE ||
                        "style" !== t7.name ||
                        t7.strings?.length > 2)
                )
                    throw Error(
                        "The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute."
                    )
            }
            render(t7) {
                return Object.keys(t7).reduce((e11, r8) => {
                    const s11 = t7[r8]
                    return null == s11
                        ? e11
                        : e11 +
                              `${(r8 = r8.includes("-") ? r8 : r8.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase())}:${s11};`
                }, "")
            }
            update(e11, [r8]) {
                const { style: s11 } = e11.element
                if (void 0 === this.ft)
                    return (
                        (this.ft = new Set(Object.keys(r8))),
                        this.render(r8)
                    )
                for (const t7 of this.ft)
                    null == r8[t7] &&
                        (this.ft.delete(t7),
                        t7.includes("-")
                            ? s11.removeProperty(t7)
                            : (s11[t7] = null))
                for (const t7 in r8) {
                    const e12 = r8[t7]
                    if (null != e12) {
                        this.ft.add(t7)
                        const r9 = "string" == typeof e12 && e12.endsWith(i10)
                        t7.includes("-") || r9
                            ? s11.setProperty(
                                  t7,
                                  r9 ? e12.slice(0, -11) : e12,
                                  r9 ? n8 : ""
                              )
                            : (s11[t7] = e12)
                    }
                }
                return E
            }
        }
    )

    // node_modules/lit-html/directives/class-map.js
    var e10 = e7(
        class extends i8 {
            constructor(t7) {
                if (
                    (super(t7),
                    t7.type !== t4.ATTRIBUTE ||
                        "class" !== t7.name ||
                        t7.strings?.length > 2)
                )
                    throw Error(
                        "`classMap()` can only be used in the `class` attribute and must be the only part in the attribute."
                    )
            }
            render(t7) {
                return (
                    " " +
                    Object.keys(t7)
                        .filter((s11) => t7[s11])
                        .join(" ") +
                    " "
                )
            }
            update(s11, [i12]) {
                if (void 0 === this.st) {
                    ;((this.st = /* @__PURE__ */ new Set()),
                        void 0 !== s11.strings &&
                            (this.nt = new Set(
                                s11.strings
                                    .join(" ")
                                    .split(/\s/)
                                    .filter((t7) => "" !== t7)
                            )))
                    for (const t7 in i12)
                        i12[t7] && !this.nt?.has(t7) && this.st.add(t7)
                    return this.render(i12)
                }
                const r8 = s11.element.classList
                for (const t7 of this.st)
                    t7 in i12 || (r8.remove(t7), this.st.delete(t7))
                for (const t7 in i12) {
                    const s12 = !!i12[t7]
                    s12 === this.st.has(t7) ||
                        this.nt?.has(t7) ||
                        (s12
                            ? (r8.add(t7), this.st.add(t7))
                            : (r8.remove(t7), this.st.delete(t7)))
                }
                return E
            }
        }
    )

    // src/blocks/FileItem/FileActionButton.ts
    var L10N_REMOVE_KEY = "file-item-remove-button"
    var FileActionButton = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.uploading = false
            this.failed = false
            this.success = false
            this.idle = false
            this.hideRemove = false
            this.progress = 0
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-file-action-button"]
        }
        get Jj() {
            return Math.min(Math.max(this.progress || 0, 0), 100)
        }
        Kj() {
            this.dispatchEvent(
                new CustomEvent("uc:remove", {
                    bubbles: true,
                    composed: true,
                })
            )
        }
        render() {
            const classes = e10({
                "uc-remove-btn": true,
                "uc-mini-btn": true,
                "uc-idle": this.idle,
                "uc-uploading": this.uploading,
                "uc-hide-remove": this.hideRemove,
                "uc-failed": this.failed,
                "uc-success": this.success,
            })
            const progressOffset = 100 - this.Jj
            const actionLabel = this.l10n(L10N_REMOVE_KEY)
            return b2`
      <button
          type="button"
          @click=${this.Kj}
          title=${actionLabel}
          aria-label=${actionLabel}
          class=${classes}
        >
          <span class="uc-icon-wrap">
            <uc-icon name="close"></uc-icon>
            <uc-icon name="remove-file"></uc-icon>
          </span>
          <uc-icon
            name="preloader"
            class="uc-preloader"
            style=${o11({
                "--l-progress-offset": String(progressOffset),
            })}
          ></uc-icon>
        </button>
    `
        }
    }
    __decorateClass(
        [n5({ type: Boolean })],
        FileActionButton.prototype,
        "uploading",
        2
    )
    __decorateClass(
        [n5({ type: Boolean })],
        FileActionButton.prototype,
        "failed",
        2
    )
    __decorateClass(
        [n5({ type: Boolean })],
        FileActionButton.prototype,
        "success",
        2
    )
    __decorateClass(
        [n5({ type: Boolean })],
        FileActionButton.prototype,
        "idle",
        2
    )
    __decorateClass(
        [n5({ type: Boolean })],
        FileActionButton.prototype,
        "hideRemove",
        2
    )
    __decorateClass(
        [n5({ type: Number })],
        FileActionButton.prototype,
        "progress",
        2
    )

    // src/blocks/FileItem/FileItem.ts
    var FileItemState = Object.freeze({
        FINISHED: /* @__PURE__ */ Symbol("FINISHED"),
        FAILED: /* @__PURE__ */ Symbol("FAILED"),
        UPLOADING: /* @__PURE__ */ Symbol("UPLOADING"),
        VALIDATION: /* @__PURE__ */ Symbol("VALIDATION"),
        QUEUED_UPLOADING: /* @__PURE__ */ Symbol("QUEUED-UPLOADING"),
        QUEUED_VALIDATION: /* @__PURE__ */ Symbol("QUEUED-VALIDATION"),
        IDLE: /* @__PURE__ */ Symbol("IDLE"),
    })
    var _FileItem = class _FileItem extends FileItemConfig {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.og = true
            this.uid = ""
            this.Xd = ""
            this.Yd = ""
            this.Zd = ""
            this.fa = 0
            this.Lj = false
            this._d = ""
            this.$d = false
            this.ae = false
            this.be = false
            this.pg = false
            this.qg = false
            this.ce = false
            this.rg = ""
            this.Hc = []
            this.sg = false
            this.de = () => {
                this.telemetryManager.sendEvent({
                    payload: {
                        metadata: {
                            event: "remove-file",
                            node: this.tagName,
                        },
                    },
                })
                if (this.uid && this.uploadCollection.hasItem(this.uid)) {
                    this.entry?.getValue("abortController")?.abort()
                    this.uploadCollection.remove(this.uid)
                }
            }
            this.Ll = () => {
                this.tg()
            }
            this.z = debounce(() => this.ug(), 100)
            this.Nj = this.withEntry(
                throttle((entry, state) => {
                    const errorText =
                        entry.getValue("errors")?.[0]?.message ?? ""
                    const source = entry.getValue("source")
                    const externalUrl = entry.getValue("externalUrl")
                    const isFinished = state === FileItemState.FINISHED
                    const isUploading = state === FileItemState.UPLOADING
                    const isQueuedForUploading =
                        state === FileItemState.QUEUED_UPLOADING
                    const isQueuedForValidation =
                        state === FileItemState.QUEUED_VALIDATION
                    const isValidationPending =
                        state === FileItemState.VALIDATION
                    const fileName = entry.getValue("fileName")
                    let hint = ""
                    if (errorText) {
                        hint = ""
                    } else if (
                        !isFinished &&
                        externalUrl &&
                        source &&
                        Object.values(ExternalUploadSource).includes(source)
                    ) {
                        hint = this.l10n("waiting-for", {
                            source: this.l10n(
                                `src-type-${canonicalSourceName(source)}`
                            ),
                        })
                    }
                    this.Zd = hint
                    this.Yd = errorText
                    this.Lj =
                        isUploading ||
                        isQueuedForUploading ||
                        isQueuedForValidation ||
                        isValidationPending
                    this.fa =
                        isQueuedForValidation || isValidationPending
                            ? 0
                            : entry.getValue("uploadProgress")
                    this.rg = fileName
                        ? this.l10n("a11y-file-item-status", {
                              fileName,
                              status: this.l10n(
                                  state?.description?.toLocaleLowerCase() ?? ""
                              ).toLocaleLowerCase(),
                          })
                        : ""
                }, 100)
            )
            this.tg = this.withEntry(async (entry) => {
                if (!this.uploadCollection.read(entry.uid)) {
                    return
                }
                if (
                    entry.getValue("fileInfo") ||
                    entry.getValue("isUploading") ||
                    entry.getValue("errors").length > 0 ||
                    entry.getValue("isValidationPending")
                ) {
                    return
                }
                const multipleMax = this.cfg.multiple ? this.cfg.multipleMax : 1
                if (multipleMax && this.uploadCollection.size > multipleMax) {
                    return
                }
                entry.setMultipleValues({
                    isUploading: true,
                    errors: [],
                    isQueuedForUploading: true,
                })
                this.z()
                try {
                    const abortController = new AbortController()
                    entry.setValue("abortController", abortController)
                    const uploadTask = async () => {
                        entry.setValue("isQueuedForUploading", false)
                        let file = entry.getValue("file")
                        if (file instanceof File || file instanceof Blob) {
                            const pluginManager = this.a.pluginManager
                            const beforeUploadHooks = (
                                pluginManager?.snapshot().fileHooks ?? []
                            ).filter((h8) => h8.type === "beforeUpload")
                            for (const hook of beforeUploadHooks) {
                                try {
                                    const hookPromise = hook.handler({
                                        file,
                                        signal: abortController.signal,
                                    })
                                    const timeoutPromise = new Promise(
                                        (_2, reject) =>
                                            setTimeout(
                                                () =>
                                                    reject(
                                                        new Error(
                                                            `beforeUpload hook timed out`
                                                        )
                                                    ),
                                                hook.timeout
                                            )
                                    )
                                    const { file: newFile } =
                                        await Promise.race([
                                            hookPromise,
                                            timeoutPromise,
                                        ])
                                    if (newFile !== file) {
                                        file = newFile
                                        entry.setValue(
                                            "mimeType",
                                            file.type || null
                                        )
                                        entry.setValue(
                                            "isImage",
                                            fileIsImage(file)
                                        )
                                        entry.setValue("fileSize", file.size)
                                        if (file instanceof File) {
                                            entry.setValue(
                                                "fileName",
                                                file.name
                                            )
                                        }
                                    }
                                } catch (error) {
                                    console.warn(
                                        `File hook "beforeUpload" from plugin "${hook.pluginId}" failed`,
                                        error
                                    )
                                }
                            }
                        }
                        const fileInput =
                            file ||
                            entry.getValue("externalUrl") ||
                            entry.getValue("uuid")
                        if (!fileInput) {
                            throw new Error("No file input")
                        }
                        const baseUploadClientOptions =
                            await this.getUploadClientOptions()
                        const uploadClientOptions = {
                            ...baseUploadClientOptions,
                            fileName: entry.getValue("fileName") ?? void 0,
                            source: entry.getValue("source") ?? void 0,
                            onProgress: (progress) => {
                                if (progress.isComputable) {
                                    const percentage = progress.value * 100
                                    entry.setValue("uploadProgress", percentage)
                                }
                            },
                            signal: abortController.signal,
                            metadata: await this.getMetadataFor(entry.uid),
                            tags: await this.getTagsFor(entry.uid),
                        }
                        this.debugPrint(
                            "upload options",
                            fileInput,
                            uploadClientOptions
                        )
                        return uploadFile(fileInput, uploadClientOptions)
                    }
                    const fileInfo =
                        await this.$["*uploadQueue"].add(uploadTask)
                    entry.setMultipleValues({
                        fileInfo,
                        isQueuedForUploading: false,
                        isUploading: false,
                        fileName: fileInfo.originalFilename,
                        fileSize: fileInfo.size,
                        isImage: fileInfo.isImage ?? false,
                        mimeType:
                            fileInfo.contentInfo?.mime?.mime ??
                            fileInfo.mimeType,
                        uuid: fileInfo.uuid,
                        cdnUrl: entry.getValue("cdnUrl") ?? fileInfo.cdnUrl,
                        cdnUrlModifiers:
                            entry.getValue("cdnUrlModifiers") ?? "",
                        uploadProgress: 100,
                        source: entry.getValue("source") ?? null,
                    })
                    if (entry === this.entry) {
                        this.z()
                    }
                } catch (cause) {
                    const isCancelError =
                        cause instanceof CancelError && cause.isCancel
                    if (isCancelError) {
                        entry.setMultipleValues({
                            isUploading: false,
                            uploadProgress: 0,
                        })
                    } else if (cause instanceof UploadcareError) {
                        entry.setMultipleValues({
                            isUploading: false,
                            uploadProgress: 0,
                            uploadError: cause,
                        })
                    } else {
                        console.error("Unknown upload error", cause)
                        entry.setMultipleValues({
                            isUploading: false,
                            uploadProgress: 0,
                            // TODO: Add translation?
                            uploadError: new Error("Something went wrong", {
                                cause,
                            }),
                        })
                    }
                    if (entry === this.entry) {
                        this.z()
                    }
                    if (this.isConnected && !isCancelError) {
                        this.telemetryManager.sendEventError(
                            cause,
                            "file upload. Failed to upload file"
                        )
                    }
                }
            })
        }
        ug() {
            const entry = this.entry
            if (!entry) {
                return
            }
            let state = FileItemState.IDLE
            if (entry.getValue("errors").length > 0) {
                state = FileItemState.FAILED
            } else if (entry.getValue("isQueuedForUploading")) {
                state = FileItemState.QUEUED_UPLOADING
            } else if (entry.getValue("isQueuedForValidation")) {
                state = FileItemState.QUEUED_VALIDATION
            } else if (entry.getValue("isValidationPending")) {
                state = FileItemState.VALIDATION
            } else if (entry.getValue("isUploading")) {
                state = FileItemState.UPLOADING
            } else if (entry.getValue("fileInfo")) {
                state = FileItemState.FINISHED
            }
            this.Mj(entry, state)
        }
        Mj(_entry, state) {
            if (state === FileItemState.FAILED) {
                this._d = "badge-error"
            } else if (state === FileItemState.FINISHED) {
                this._d = "badge-success"
            }
            if (state === FileItemState.UPLOADING) {
                this.qg = false
                this.removeAttribute("focused")
            }
            this.ae = state === FileItemState.FAILED
            this.be = state === FileItemState.UPLOADING
            this.pg =
                state === FileItemState.QUEUED_UPLOADING ||
                state === FileItemState.UPLOADING
            this.$d = state === FileItemState.FINISHED
            this.Nj(state)
        }
        reset() {
            super.reset()
            this.z.cancel()
        }
        Ib(entries) {
            const [entry] = entries
            if (!entry) {
                return
            }
            if (entry.isIntersecting && !this.sg) {
                this.og = false
                this.sg = true
            }
        }
        vg(id) {
            this.reset()
            const entry = this.uploadCollection?.read(id)
            this.entry = entry
            if (!entry) {
                this.Sa()
                return
            }
            this.subEntry("isQueuedForValidation", () => {
                this.z()
            })
            this.subEntry("isValidationPending", () => {
                this.z()
            })
            this.subEntry("uploadProgress", () => {
                this.z()
            })
            this.subEntry("isQueuedForUploading", () => {
                this.z()
            })
            this.subEntry("fileName", (name) => {
                this.Xd =
                    name ||
                    entry.getValue("externalUrl") ||
                    this.l10n("file-no-name")
                this.z()
            })
            this.subEntry("externalUrl", (externalUrl) => {
                this.Xd =
                    entry.getValue("fileName") ||
                    externalUrl ||
                    this.l10n("file-no-name")
            })
            this.subEntry("fileInfo", () => {
                this.z()
            })
            this.subEntry("errors", () => this.z())
            this.subEntry("isUploading", () => this.z())
            this.subEntry("fileSize", () => this.z())
            this.subEntry("mimeType", () => this.z())
            this.subEntry("isImage", () => this.z())
            this.subEntry("fileInfo", () => this.Sa())
            this.subEntry("isUploading", () => this.Sa())
            this.subEntry("errors", () => this.Sa())
            this.ug()
            this.Sa()
        }
        wg(value) {
            const isListMode = this.cfg.filesViewMode === "list"
            if (isListMode) {
                this.ce = true
                return
            }
            this.ce = value
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (changedProperties.has("uid")) {
                this.vg(this.uid)
            }
        }
        Sa() {
            const pluginManager = this.a.pluginManager
            if (!pluginManager || !this.uid) {
                this.Hc = []
                return
            }
            const allFileActions = pluginManager.snapshot().fileActions
            const outputFileEntry = this.api.getOutputItem(this.uid)
            if (!outputFileEntry) {
                this.Hc = []
                return
            }
            this.Hc = allFileActions.filter((action) => {
                try {
                    return action.shouldRender(outputFileEntry)
                } catch (error) {
                    console.error(
                        `Error in plugin file action shouldRender (${action.id}):`,
                        error
                    )
                    return false
                }
            })
        }
        Oj(action) {
            if (!this.uid) {
                return
            }
            const outputFileEntry = this.api.getOutputItem(this.uid)
            if (!outputFileEntry) {
                return
            }
            this.telemetryManager.sendEvent({
                payload: {
                    metadata: {
                        event: action.id,
                        node: this.tagName,
                        pluginId: action.pluginId,
                    },
                },
            })
            try {
                action.onClick(outputFileEntry)
            } catch (error) {
                console.error(
                    `Error in plugin file action onClick (${action.id}):`,
                    error
                )
            }
        }
        initCallback() {
            super.initCallback()
            this.vg(this.uid)
            this.subConfigValue("filesViewMode", (mode) => {
                this.wg(this.cfg.gridShowFileNames)
                this.setAttribute("mode", mode)
            })
            this.subConfigValue("gridShowFileNames", (value) => {
                this.wg(value)
            })
            this.onclick = () => {
                _FileItem.activeInstances.forEach((inst) => {
                    if (inst === this) {
                        inst.setAttribute("focused", "")
                    } else {
                        inst.removeAttribute("focused")
                    }
                })
            }
            this.sub("*uploadTrigger", (itemsToUpload) => {
                if (this.entry && !itemsToUpload.has(this.entry.uid)) {
                    return
                }
                setTimeout(() => this.isConnected && this.tg())
            })
            const pluginManager = this.a.pluginManager
            if (pluginManager?.onPluginsChange) {
                this.w = pluginManager.onPluginsChange(() => this.Sa())
            }
            this.Sa()
            _FileItem.activeInstances.add(this)
        }
        connectedCallback() {
            super.connectedCallback()
            this.e = new window.IntersectionObserver(this.Ib.bind(this), {
                threshold: [0, 1],
            })
            this.e.observe(this)
        }
        disconnectedCallback() {
            this.w?.()
            this.w = void 0
            super.disconnectedCallback()
            this.e?.disconnect()
            _FileItem.activeInstances.delete(this)
            this.reset()
        }
        static {
            this.activeInstances = /* @__PURE__ */ new Set()
        }
        shouldUpdate(changedProperties) {
            if (this.og) {
                return false
            }
            return super.shouldUpdate(changedProperties)
        }
        render() {
            return b2`
      <div
        class="uc-inner"
        ?data-finished=${this.$d}
        ?data-uploading=${this.be}
        ?data-failed=${this.ae}
        ?data-focused=${this.qg}
      >
        <uc-thumb .uid=${this.uid} .badgeIcon=${this._d}></uc-thumb>

        <div aria-atomic="true" aria-live="polite" class="uc-file-name-wrapper" aria-label=${this.rg}>
          <span class="uc-file-name" ?hidden=${!this.ce}>${this.Xd}</span>
          <span class="uc-file-error" ?hidden=${!this.Yd}>${this.Yd}</span>
          <span class="uc-file-hint" ?hidden=${!this.Zd}>${this.Zd}</span>
        </div>
        <div class="uc-file-actions">
          ${this.Hc.map(
              (action) => b2`
              <button
                type="button"
                @click=${() => this.Oj(action)}
                title=${this.l10n(action.label)}
                aria-label=${this.l10n(action.label)}
                class="uc-plugin-action-btn uc-mini-btn"
                data-plugin-action-id=${action.id}
              >
                <uc-icon name=${action.icon}></uc-icon>
              </button>
            `
          )}
          <uc-file-action-button
            @uc:remove=${this.de}
            .uploading=${this.be}
            .hideRemove=${this.pg}
            .progress=${this.fa}
            .failed=${this.ae}
            .success=${this.$d}
          ></uc-file-action-button>
        </div>
      </div>
    `
        }
    }
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "og", 2)
    __decorateClass(
        [
            n5({
                attribute: false,
            }),
        ],
        _FileItem.prototype,
        "uid",
        2
    )
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "Xd", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "Yd", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "Zd", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "fa", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "Lj", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "_d", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "$d", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "ae", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "be", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "pg", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "qg", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "ce", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "rg", 2)
    __decorateClass([r5()], _FileItem.prototype, /* @__KEY__ */ "Hc", 2)
    var FileItem = _FileItem

    // src/blocks/DropArea/getDropItems.ts
    function checkIsDirectory(file) {
        return new Promise((resolve) => {
            if (typeof window.FileReader !== "function") {
                resolve(false)
            }
            try {
                const reader = new FileReader()
                reader.onerror = () => {
                    resolve(true)
                }
                const onLoad = (event) => {
                    if (event.type !== "loadend") {
                        reader.abort()
                    }
                    resolve(false)
                }
                reader.onloadend = onLoad
                reader.onprogress = onLoad
                reader.readAsDataURL(file)
            } catch {
                resolve(false)
            }
        })
    }
    function readEntryContentAsync(webkitEntry, dataTransferItemType) {
        return new Promise((resolve) => {
            let reading = 0
            const dropItems = []
            const readEntry = (entry) => {
                if (!entry) {
                    console.warn("Unexpectedly received empty content entry", {
                        scope: "drag-and-drop",
                    })
                    resolve(null)
                    return
                }
                if (entry.isFile) {
                    reading++
                    entry.file((file) => {
                        reading--
                        const clonedFile = new File([file], file.name, {
                            type: file.type || dataTransferItemType,
                        })
                        dropItems.push({
                            type: "file",
                            file: clonedFile,
                            fullPath: entry.fullPath,
                        })
                        if (reading === 0) {
                            resolve(dropItems)
                        }
                    })
                } else if (entry.isDirectory) {
                    readReaderContent(entry.createReader())
                }
            }
            const readReaderContent = (reader) => {
                reading++
                reader.readEntries((entries) => {
                    reading--
                    for (const entry of entries) {
                        readEntry(entry)
                    }
                    if (reading === 0) {
                        resolve(dropItems)
                    }
                })
            }
            readEntry(webkitEntry)
        })
    }
    function getDropItems(dataTransfer) {
        const dropItems = []
        const promises = []
        for (let i12 = 0; i12 < dataTransfer.items.length; i12++) {
            const item = dataTransfer.items[i12]
            if (!item) {
                continue
            }
            if (item.kind === "file") {
                const itemType = item.type
                const withEntry = item
                if (
                    typeof withEntry.webkitGetAsEntry === "function" ||
                    typeof withEntry.getAsEntry === "function"
                ) {
                    const entry =
                        typeof withEntry.webkitGetAsEntry === "function"
                            ? withEntry.webkitGetAsEntry()
                            : withEntry.getAsEntry?.()
                    if (entry) {
                        promises.push(
                            readEntryContentAsync(entry, itemType).then(
                                (items) => {
                                    if (items) {
                                        dropItems.push(...items)
                                    }
                                }
                            )
                        )
                    }
                    continue
                }
                const file = item.getAsFile()
                if (file) {
                    promises.push(
                        checkIsDirectory(file).then((isDirectory) => {
                            if (!isDirectory) {
                                dropItems.push({
                                    type: "file",
                                    file,
                                })
                            }
                        })
                    )
                }
            } else if (
                item.kind === "string" &&
                /^text\/uri-list/.test(item.type)
            ) {
                promises.push(
                    new Promise((resolve) => {
                        item.getAsString((value) => {
                            dropItems.push({
                                type: "url",
                                url: value,
                            })
                            resolve()
                        })
                    })
                )
            }
        }
        return Promise.all(promises).then(() => dropItems)
    }

    // src/blocks/DropArea/addDropzone.ts
    var DropzoneState = Object.freeze({
        ACTIVE: 0,
        INACTIVE: 1,
        NEAR: 2,
        OVER: 3,
    })
    var RESET_EVENTS = ["focus"]
    var NEAR_OFFSET = 100
    var nearnessRegistry = /* @__PURE__ */ new Map()
    function distance(point, rect) {
        const cx = Math.max(Math.min(point[0], rect.x + rect.width), rect.x)
        const cy = Math.max(Math.min(point[1], rect.y + rect.height), rect.y)
        return Math.sqrt(
            (point[0] - cx) * (point[0] - cx) +
                (point[1] - cy) * (point[1] - cy)
        )
    }
    function addDropzone(desc) {
        let eventCounter = 0
        const body = document.body
        const switchHandlers = /* @__PURE__ */ new Set()
        const handleSwitch = (fn) => {
            switchHandlers.add(fn)
        }
        let state = DropzoneState.INACTIVE
        const setState = (newState) => {
            if (desc.shouldIgnore() && newState !== DropzoneState.INACTIVE) {
                return
            }
            if (state !== newState) {
                switchHandlers.forEach((fn) => {
                    fn(newState)
                })
            }
            state = newState
        }
        const isDragging = () => eventCounter > 0
        handleSwitch((newState) => desc.onChange(newState))
        const onResetEvent = () => {
            eventCounter = 0
            setState(DropzoneState.INACTIVE)
        }
        const onDragEnter = () => {
            eventCounter += 1
            if (state === DropzoneState.INACTIVE) {
                setState(DropzoneState.ACTIVE)
            }
        }
        const onDragLeave = () => {
            eventCounter -= 1
            if (!isDragging()) {
                setState(DropzoneState.INACTIVE)
            }
        }
        const onDrop = (event) => {
            event.preventDefault()
            eventCounter = 0
            setState(DropzoneState.INACTIVE)
        }
        const onDragOver = (event) => {
            if (desc.shouldIgnore()) {
                return
            }
            if (!isDragging()) {
                eventCounter += 1
            }
            const dragPoint = [event.x, event.y]
            const targetRect = desc.element.getBoundingClientRect()
            const nearness = Math.floor(distance(dragPoint, targetRect))
            const isNear = nearness < NEAR_OFFSET
            const isOver = event.composedPath().includes(desc.element)
            nearnessRegistry.set(desc.element, nearness)
            const minNearness = Math.min(...nearnessRegistry.values())
            const isNearest = minNearness === nearness
            if (isOver && isNearest) {
                event.preventDefault()
                setState(DropzoneState.OVER)
            } else if (isNear && isNearest) {
                setState(DropzoneState.NEAR)
            } else {
                setState(DropzoneState.ACTIVE)
            }
        }
        const onElementDrop = async (event) => {
            if (desc.shouldIgnore()) {
                return
            }
            event.preventDefault()
            const { dataTransfer } = event
            if (!dataTransfer) {
                return
            }
            const items = await getDropItems(dataTransfer)
            desc.onItems(items)
            setState(DropzoneState.INACTIVE)
        }
        body.addEventListener("drop", onDrop)
        body.addEventListener("dragleave", onDragLeave)
        body.addEventListener("dragenter", onDragEnter)
        body.addEventListener("dragover", onDragOver)
        desc.element.addEventListener("drop", onElementDrop)
        RESET_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, onResetEvent)
        })
        return () => {
            nearnessRegistry.delete(desc.element)
            body.removeEventListener("drop", onDrop)
            body.removeEventListener("dragleave", onDragLeave)
            body.removeEventListener("dragenter", onDragEnter)
            body.removeEventListener("dragover", onDragOver)
            desc.element.removeEventListener("drop", onElementDrop)
            RESET_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, onResetEvent)
            })
        }
    }

    // src/blocks/DropArea/DropArea.ts
    var dropAreaRegistry = /* @__PURE__ */ new Set()
    var DropArea = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.single = false
            this.ghost = false
            this.disabled = false
            this.clickable = false
            this.withIcon = false
            this.fullscreen = false
            this.initflow = false
            this.ya = true
            this.xg = true
            this.ee = "drop-files-here"
            this.lb = false
            this.zg = null
            this.fe = null
            this.Ag = e9()
            this.mb = (event) => {
                if (event instanceof KeyboardEvent) {
                    if (event.code !== "Space" && event.code !== "Enter") {
                        return
                    }
                } else if (!(event instanceof MouseEvent)) {
                    return
                }
                if (this.initflow) {
                    this.api.initFlow()
                    return
                }
                this.api.openSystemDialog()
            }
            this.Bg = true
            this.nb = false
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-drop-area"]
        }
        yg() {
            const customText = this.text
            if (typeof customText === "string" && customText.length > 0) {
                this.ee = customText
                return
            }
            this.ee = this.lb ? "drop-files-here" : "drop-file-here"
        }
        isActive() {
            if (!this.ya) {
                return false
            }
            const bounds = this.getBoundingClientRect()
            const hasSize = bounds.width > 0 && bounds.height > 0
            const isInViewport =
                bounds.top >= 0 &&
                bounds.left >= 0 &&
                bounds.bottom <=
                    (window.innerHeight ||
                        document.documentElement.clientHeight) &&
                bounds.right <=
                    (window.innerWidth || document.documentElement.clientWidth)
            const style = window.getComputedStyle(this)
            const visible =
                style.visibility !== "hidden" && style.display !== "none"
            return hasSize && visible && isInViewport
        }
        initCallback() {
            super.initCallback()
            dropAreaRegistry.add(this)
            this.ge()
            this.he()
            this.Cg()
            this.Dg(DropzoneState.INACTIVE)
            this.zg = addDropzone({
                element: this,
                shouldIgnore: () => this.Eg(),
                onChange: (state) => {
                    this.Dg(state)
                },
                onItems: (items) => {
                    if (!items.length) {
                        return
                    }
                    const prevSize = this.uploadCollection.size
                    items.forEach((item) => {
                        if (item.type === "url") {
                            this.api.addFileFromUrl(item.url, {
                                source: UploadSource.DROP_AREA,
                            })
                        } else if (item.type === "file") {
                            this.api.addFileFromObject(item.file, {
                                source: UploadSource.DROP_AREA,
                                fullPath: item.fullPath,
                            })
                        }
                    })
                    if (this.uploadCollection.size > prevSize) {
                        this.routerLayer.navigateAfterFileAdd()
                    }
                },
            })
            this.updateComplete.then(() => this.Pj())
            this.subConfigValue("sourceList", (value) => {
                const list = stringToArray(value)
                this.Bg = list.includes(UploadSource.LOCAL)
                this.ge()
                this.he()
            })
            this.subConfigValue("multiple", (val) => {
                this.lb = Boolean(val)
                this.yg()
            })
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (changedProperties.has("disabled")) {
                this.ge()
                this.he()
            }
            if (
                changedProperties.has("text") ||
                changedProperties.has("localeId")
            ) {
                this.yg()
            }
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("clickable")) {
                this.Cg()
            }
        }
        /** Ignore drop events if there are other visible drop areas on the page. */
        Eg() {
            if (!this.ya) {
                return true
            }
            if (!this.Qj()) {
                return true
            }
            if (!this.fullscreen) {
                return false
            }
            const registry = dropAreaRegistry
            if (registry.size === 0) {
                return false
            }
            const otherTargets = [...registry].filter((el) => el !== this)
            const activeTargets = otherTargets.filter((el) => el.isActive())
            return activeTargets.length > 0
        }
        Qj() {
            const isMultiple = this.cfg.multiple
            const multipleMax = this.cfg.multipleMax
            const currentFilesCount = this.uploadCollection.size
            if (isMultiple && multipleMax && currentFilesCount >= multipleMax) {
                return false
            }
            if (!isMultiple && currentFilesCount > 0) {
                return false
            }
            return true
        }
        ge() {
            const nextIsEnabled = this.Bg && !this.disabled
            this.ya = nextIsEnabled
        }
        he() {
            const shouldBeVisible =
                this.ya || !this.querySelector("[data-default-slot]")
            this.xg = shouldBeVisible
            this.hidden = !shouldBeVisible
        }
        Dg(state) {
            const stateText = Object.entries(DropzoneState)
                .find(([, value]) => value === state)?.[0]
                .toLowerCase()
            if (stateText) {
                this.setAttribute("drag-state", stateText)
            }
        }
        Pj() {
            if (this.fe) {
                return
            }
            const contentWrapperEl = this.Ag.value
            if (!contentWrapperEl) {
                return
            }
            this.fe = addDropzone({
                element: contentWrapperEl,
                onChange: (state) => {
                    const stateText = Object.entries(DropzoneState)
                        .find(([, value]) => value === state)?.[0]
                        .toLowerCase()
                    stateText &&
                        contentWrapperEl.setAttribute("drag-state", stateText)
                },
                onItems: () => {},
                shouldIgnore: () => this.Eg(),
            })
        }
        Cg() {
            if (this.clickable && !this.nb) {
                this.addEventListener("keydown", this.mb)
                this.addEventListener("click", this.mb)
                this.nb = true
            } else if (!this.clickable && this.nb) {
                this.removeEventListener("keydown", this.mb)
                this.removeEventListener("click", this.mb)
                this.nb = false
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            dropAreaRegistry.delete(this)
            this.zg?.()
            this.fe?.()
            if (this.nb) {
                this.removeEventListener("keydown", this.mb)
                this.removeEventListener("click", this.mb)
                this.nb = false
            }
        }
        render() {
            return b2`
      ${this.yield(
          "",
          b2`<div data-default-slot hidden></div>
          <div
            ${n7(this.Ag)}
            class="uc-content-wrapper"
            ?hidden=${!this.xg}
          >
            <div class="uc-icon-container" ?hidden=${!this.withIcon}>
              <uc-icon name="default"></uc-icon>
              <uc-icon name="arrow-down"></uc-icon>
            </div>
            <span class="uc-text">${this.l10n(this.ee)}</span>
          </div>`
      )}
    `
        }
    }
    __decorateClass(
        [n5({ type: Boolean, noAccessor: true })],
        DropArea.prototype,
        "single",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, noAccessor: true })],
        DropArea.prototype,
        "ghost",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        DropArea.prototype,
        "disabled",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        DropArea.prototype,
        "clickable",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, attribute: "with-icon", reflect: true })],
        DropArea.prototype,
        "withIcon",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        DropArea.prototype,
        "fullscreen",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        DropArea.prototype,
        "initflow",
        2
    )
    __decorateClass([n5({ type: String })], DropArea.prototype, "text", 2)
    __decorateClass([r5()], DropArea.prototype, /* @__KEY__ */ "ya", 2)
    __decorateClass([r5()], DropArea.prototype, /* @__KEY__ */ "xg", 2)

    // src/blocks/UploadList/UploadList.ts
    var UploadList = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.historyTracked = true
            this.activityType = LitActivityBlock.activities.UPLOAD_LIST
            this.Fg = false
            this.Gg = false
            this.Hg = false
            this.ie = false
            this.je = false
            this.Ic = null
            this.Ig = false
            this.ke = null
            this.Jg = () => {
                this.telemetryManager.sendEvent({
                    eventType: InternalEventType.ACTION_EVENT,
                    payload: {
                        metadata: {
                            event: "add-more",
                            node: this.tagName,
                        },
                    },
                })
                this.api.initFlow(true)
            }
            this.Tj = () => {
                this.emit(EventType.UPLOAD_CLICK)
                this.api.uploadAll()
                this.K()
            }
            this.le = () => {
                this.emit(
                    EventType.DONE_CLICK,
                    this.api.getOutputCollectionState()
                )
                this.api.doneFlow()
            }
            this.ta = () => {
                this.telemetryManager.sendEvent({
                    eventType: InternalEventType.ACTION_EVENT,
                    payload: {
                        metadata: {
                            event: "clear-all",
                            node: this.tagName,
                        },
                    },
                })
                this.uploadCollection.clearAll()
            }
            this.K = throttle(() => {
                if (!this.isConnected) {
                    return
                }
                this.Uj()
                if (
                    !this.couldOpenActivity &&
                    this.$["*currentActivity"] === this.activityType
                ) {
                    this.historyBack()
                }
                if (!this.cfg.confirmUpload) {
                    this.api.uploadAll()
                }
            }, 300)
        }
        get Rj() {
            if (!this.ke) {
                return ""
            }
            return this.Sj(this.ke)
        }
        Uj() {
            const collectionState = this.api.getOutputCollectionState()
            const summary = {
                total: collectionState.totalCount,
                succeed: collectionState.successCount,
                uploading: collectionState.uploadingCount,
                failed: collectionState.failedCount,
                validatingBeforeUploading: collectionState.idleEntries.filter(
                    (e11) => e11.isValidationPending
                ).length,
            }
            const fitCountRestrictions = !collectionState.errors.some(
                (err) =>
                    err.type === "TOO_MANY_FILES" ||
                    err.type === "TOO_FEW_FILES"
            )
            const tooMany = collectionState.errors.some(
                (err) => err.type === "TOO_MANY_FILES"
            )
            const exact =
                collectionState.totalCount ===
                (this.cfg.multiple ? this.cfg.multipleMax : 1)
            const isValidationPending = collectionState.allEntries.some(
                (entry) => entry.isValidationPending
            )
            const validationOk =
                summary.failed === 0 &&
                collectionState.errors.length === 0 &&
                !isValidationPending
            let uploadBtnVisible = false
            let allDone = false
            let doneBtnEnabled = false
            const readyToUpload =
                summary.total -
                summary.succeed -
                summary.uploading -
                summary.failed
            if (
                readyToUpload > 0 &&
                fitCountRestrictions &&
                validationOk &&
                this.cfg.confirmUpload
            ) {
                uploadBtnVisible = true
            } else {
                allDone = true
                const groupOk = this.cfg.groupOutput
                    ? !!collectionState.group
                    : true
                doneBtnEnabled =
                    summary.total === summary.succeed &&
                    fitCountRestrictions &&
                    validationOk &&
                    groupOk
            }
            this.Fg = allDone
            this.Gg = doneBtnEnabled
            this.Hg = uploadBtnVisible
            this.je = summary.total === 0 || (!tooMany && !exact)
            this.ie = !exact || this.cfg.multiple
            this.Ig = summary.total > 0
            this.ke = summary
        }
        Sj(summary) {
            const localizedText = (status) => {
                let count = summary[status]
                if (status === "uploading") {
                    count += summary.validatingBeforeUploading
                }
                return this.l10n(`header-${status}`, {
                    count,
                })
            }
            if (
                summary.uploading > 0 ||
                summary.validatingBeforeUploading > 0
            ) {
                return localizedText("uploading")
            }
            if (summary.failed > 0) {
                return localizedText("failed")
            }
            if (summary.succeed > 0) {
                return localizedText("succeed")
            }
            return localizedText("total")
        }
        get couldOpenActivity() {
            return this.cfg.showEmptyList || this.uploadCollection.size > 0
        }
        initCallback() {
            super.initCallback()
            this.registerActivity(this.activityType)
            this.subConfigValue("multiple", this.K)
            this.subConfigValue("multipleMin", this.K)
            this.subConfigValue("multipleMax", this.K)
            this.sub("*groupInfo", (groupInfo) => {
                if (groupInfo) {
                    this.K()
                }
            })
            this.subConfigValue("filesViewMode", (mode) => {
                this.setAttribute("mode", mode)
            })
            this.sub("*currentActivity", (currentActivity) => {
                if (
                    !this.couldOpenActivity &&
                    currentActivity === this.activityType
                ) {
                    this.$["*currentActivity"] = this.initActivity
                }
            })
            this.uploadCollection.observeProperties(this.K)
            this.uploadCollection.observeCollection(this.K)
            this.sub("*collectionErrors", (errors) => {
                const firstError = errors.filter(
                    (err) => err.type !== "SOME_FILES_HAS_ERRORS"
                )[0]
                if (!firstError) {
                    this.Ic = null
                    return
                }
                this.Ic = firstError.message
            })
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            if (this.has("*uploadCollection")) {
                this.uploadCollection.unobserveProperties(this.K)
                this.uploadCollection.unobserveCollection(this.K)
            }
        }
        render() {
            return b2`
  <uc-activity-header>
    <span aria-live="polite" class="uc-header-text">${this.Rj}</span>
    <button
      type="button"
      class="uc-mini-btn uc-close-btn"
      @click=${this.$["*closeModal"]}
      title=${this.l10n("a11y-activity-header-button-close")}
      aria-label=${this.l10n("a11y-activity-header-button-close")}
    >
      <uc-icon name="close"></uc-icon>
    </button>
  </uc-activity-header>

  <div class="uc-no-files" ?hidden=${this.Ig}>
    ${this.yield("empty", b2`<span>${this.l10n("no-files")}</span>`)}
  </div>

  <div class="uc-files">
    <div class="uc-files-wrapper">
    ${c8(
        this.$["*uploadList"] ?? [],
        ({ uid }) => uid,
        ({ uid }) => b2`<uc-file-item .uid=${uid}></uc-file-item>`
    )}
    </div>
    <button
      type="button"
      class="uc-add-more-btn uc-secondary-btn"
      @click=${this.Jg}
      ?disabled=${!this.je}
      ?hidden=${!this.ie}
    >
      <uc-icon name="add"></uc-icon><span>${this.l10n("add-more")}</span>
    </button>
  </div>

  <div class="uc-common-error"
  ?hidden=${!this.Ic}
  >
  ${this.Ic ?? ""}
  </div>

  <div class="uc-toolbar">
    <button type="button" class="uc-cancel-btn uc-secondary-btn" @click=${this.ta}>${this.l10n("clear")}</button>
    <div class="uc-toolbar-spacer"></div>
    <button
      type="button"
      class="uc-add-more-btn uc-secondary-btn"
      ?hidden=${!this.ie}
      ?disabled=${!this.je}
      @click=${this.Jg}
    >
      <uc-icon name="add"></uc-icon><span>${this.l10n("add-more")}</span>
    </button>
    <button
      type="button"
      class="uc-upload-btn uc-primary-btn"
      ?hidden=${!this.Hg}
      @click=${this.Tj}
    >${this.l10n("upload")}</button>
    <button
      type="button"
      class="uc-done-btn uc-primary-btn"
      ?hidden=${!this.Fg}
      ?disabled=${!this.Gg}
      @click=${this.le}
    >
      ${this.l10n("done")}
    </button>
  </div>

  <uc-drop-area ghost></uc-drop-area>
`
        }
    }
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "Fg", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "Gg", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "Hg", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "ie", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "je", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "Ic", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "Ig", 2)
    __decorateClass([r5()], UploadList.prototype, /* @__KEY__ */ "ke", 2)

    // src/blocks/Config/assertions.ts
    var ASSERTIONS = [
        {
            test: (cfg) => !!cfg.accept && !!cfg.imgOnly,
            message:
                "There could be a mistake.\nBoth `accept` and `imgOnly` parameters are set.\nThe value of `accept` will be concatenated with the internal image mime types list.",
        },
        {
            test: (cfg) => cfg.enableVideoRecording !== null,
            message:
                "The `enableVideoRecording` parameter is deprecated and will be removed in the next major release.\nPlease use the `cameraModes` parameter instead.",
        },
        {
            test: (cfg) => cfg.defaultCameraMode !== null,
            message:
                "The `defaultCameraMode` parameter is deprecated and will be removed in the next major release.\nPlease use the `cameraModes` parameter instead.",
        },
    ]
    var runAssertions = debounce((cfg) => {
        for (const { test, message } of ASSERTIONS) {
            if (test(cfg)) {
                warnOnce(message)
            }
        }
    }, 0)

    // node_modules/@uploadcare/cname-prefix/dist/isPrefixedCdnBase-BX-N6KIE.js
    var o12 = (e11, r8) => {
        const n10 = new URL(r8)
        return (
            (n10.hostname = `${e11}.${n10.hostname}`),
            n10.toString().replace(/\/$/, "")
        )
    }
    var s10 = "0123456789abcdefghijklmnopqrstuvwxyz"
    var a5 = (e11) => {
        if (e11 <= 0n) return "0"
        let r8 = ""
        for (; e11 > 0n; ) {
            const n10 = e11 % 36n
            ;((r8 = s10[Number(n10)] + r8), (e11 = e11 / 36n))
        }
        return r8
    }
    var c9 = (e11, r8) => {
        try {
            const n10 = new URL(e11).hostname,
                t7 = new URL(r8).hostname
            return n10 === t7 || n10.endsWith(`.${t7}`)
        } catch {
            return false
        }
    }

    // node_modules/@uploadcare/cname-prefix/dist/async.js
    var c10 = async (n10) => {
        const s11 = new TextEncoder().encode(n10),
            t7 = await window.crypto.subtle.digest("SHA-256", s11),
            e11 = Array.from(new Uint8Array(t7))
                .map((a6) => a6.toString(16).padStart(2, "0"))
                .join("")
        return BigInt(`0x${e11}`)
    }
    var i11 = 10
    var d5 = async (n10) => {
        const s11 = await c10(n10)
        return a5(s11).slice(0, i11)
    }
    var f6 = async (n10, s11) => {
        const t7 = await d5(n10)
        return o12(t7, s11)
    }

    // src/utils/isPromiseLike.ts
    var isPromiseLike = (value) => {
        return (
            value instanceof Promise ||
            Boolean(
                value &&
                    typeof value === "object" &&
                    "then" in value &&
                    typeof value.then === "function"
            )
        )
    }

    // src/blocks/Config/computed-properties.ts
    var defineComputedProperty = (declaration) => declaration
    var COMPUTED_PROPERTIES = [
        defineComputedProperty({
            key: "cameraModes",
            deps: ["enableVideoRecording"],
            fn: ({ cameraModes, enableVideoRecording }) => {
                const evr = enableVideoRecording()
                if (evr === null) {
                    return cameraModes()
                }
                let cameraModesCsv = deserializeCsv(cameraModes())
                if (evr && !cameraModesCsv.includes("video")) {
                    cameraModesCsv = cameraModesCsv.concat("video")
                } else if (!evr) {
                    cameraModesCsv = cameraModesCsv.filter(
                        (mode) => mode !== "video"
                    )
                }
                return serializeCsv(cameraModesCsv)
            },
        }),
        defineComputedProperty({
            key: "cameraModes",
            deps: ["defaultCameraMode"],
            fn: ({ cameraModes, defaultCameraMode }) => {
                const dcm = defaultCameraMode()
                if (dcm === null) {
                    return cameraModes()
                }
                let cameraModesCsv = deserializeCsv(cameraModes())
                cameraModesCsv = cameraModesCsv.sort((a6, b3) => {
                    if (a6 === dcm) return -1
                    if (b3 === dcm) return 1
                    return 0
                })
                return serializeCsv(cameraModesCsv)
            },
        }),
        defineComputedProperty({
            key: "cdnCname",
            deps: ["pubkey", "cdnCnamePrefixed"],
            fn: ({ pubkey, cdnCname, cdnCnamePrefixed }) => {
                const pk = pubkey()
                const cname = cdnCname()
                const prefixed = cdnCnamePrefixed()
                if (
                    pk &&
                    (cname === DEFAULT_CDN_CNAME || c9(cname, prefixed))
                ) {
                    return f6(pk, prefixed)
                }
                return cname
            },
        }),
    ]
    var computeProperty = ({
        key,
        setValue,
        getValue,
        computationControllers,
    }) => {
        for (const computed of COMPUTED_PROPERTIES) {
            if (!computed.deps.includes(key)) continue
            const args = {
                [computed.key]: () => getValue(computed.key),
            }
            for (const dep of computed.deps) {
                args[dep] = () => getValue(dep)
            }
            const abortController = new AbortController()
            computationControllers.get(computed.fn)?.abort()
            computationControllers.set(computed.fn, abortController)
            let result
            try {
                result = computed.fn(args, {
                    signal: abortController.signal,
                })
            } catch (error) {
                if (
                    computationControllers.get(computed.fn) === abortController
                ) {
                    computationControllers.delete(computed.fn)
                }
                console.error(
                    `Failed to compute value for "${computed.key}"`,
                    error
                )
                return
            }
            if (isPromiseLike(result)) {
                result
                    .then((resolvedValue) => {
                        if (abortController.signal.aborted) {
                            return
                        }
                        setValue(computed.key, resolvedValue)
                    })
                    .catch((error) => {
                        if (abortController.signal.aborted) {
                            return
                        }
                        console.error(
                            `Failed to compute value for "${computed.key}"`,
                            error
                        )
                    })
                    .finally(() => {
                        if (
                            computationControllers.get(computed.fn) ===
                            abortController
                        ) {
                            computationControllers.delete(computed.fn)
                        }
                    })
            } else {
                setValue(computed.key, result)
            }
        }
    }

    // src/blocks/Config/validatorsType.ts
    var asString = (value) => String(value)
    var asNumber2 = (value) => {
        const number = Number(value)
        if (Number.isNaN(number)) {
            throw new Error(`Invalid number: "${value}"`)
        }
        return number
    }
    var asBoolean2 = (value) => {
        if (typeof value === "undefined" || value === null) return false
        if (typeof value === "boolean") return value
        if (value === "true") return true
        if (value === "") return true
        if (value === "false") return false
        throw new Error(`Invalid boolean: "${value}"`)
    }
    var asStore = (value) => (value === "auto" ? value : asBoolean2(value))
    var asCameraCapture = (value) => {
        const strValue = asString(value)
        if (
            strValue !== "user" &&
            strValue !== "environment" &&
            strValue !== ""
        ) {
            throw new Error(`Invalid value: "${strValue}"`)
        }
        return strValue
    }
    var asCameraMode = (value) => {
        const strValue = asString(value)
        if (!Object.values(CameraSourceTypes).includes(strValue)) {
            throw new Error(`Invalid value: "${strValue}"`)
        }
        return strValue
    }
    var asCameraModes = (value) => {
        const str = asString(value)
        const array = deserializeCsv(str)
        if (
            array.some(
                (item) => !Object.values(CameraSourceTypes).includes(item)
            )
        ) {
            throw new Error(`Invalid value: "${JSON.stringify(array)}"`)
        }
        return str
    }
    var asPasteScope = (value) => {
        const strValue = asString(value)
        if (strValue === "local" || strValue === "global") {
            return strValue
        }
        if (asBoolean2(value) === false) {
            return false
        }
        throw new Error(`Invalid value: "${strValue}"`)
    }
    var asMetadata = (value) => {
        if (typeof value === "object" && !Array.isArray(value)) {
            return value
        }
        if (typeof value === "function") {
            return value
        }
        throw new Error(
            "Invalid metadata value. Must be an object or function."
        )
    }
    var asTags = (value) => {
        if (Array.isArray(value)) {
            return value
        }
        if (typeof value === "function") {
            return value
        }
        throw new Error("Invalid tags value. Must be an array or function.")
    }
    var asObject = (value) => {
        if (typeof value === "object") {
            return value
        }
        throw new Error("Invalid value. Must be an object.")
    }
    var asFunction = (value) => {
        if (typeof value === "function") {
            return value
        }
        throw new Error("Invalid value. Must be a function.")
    }
    var asArray = (value) => {
        if (Array.isArray(value)) {
            return value
        }
        throw new Error("Must be an array.")
    }
    var asFilesViewMode = (value) => {
        const strValue = asString(value)
        if (["grid", "list"].includes(strValue)) {
            return strValue
        }
        throw new Error(`Invalid value: "${strValue}"`)
    }
    var asDynamicButtonViewMode = (value) => {
        const strValue = asString(value)
        if (["auto", "menu", "toolbar", "compact"].includes(strValue)) {
            return strValue
        }
        throw new Error(`Invalid value: "${strValue}"`)
    }

    // src/blocks/Config/normalizeConfigValue.ts
    var mapping = {
        pubkey: asString,
        multiple: asBoolean2,
        multipleMin: asNumber2,
        multipleMax: asNumber2,
        confirmUpload: asBoolean2,
        imgOnly: asBoolean2,
        accept: asString,
        externalSourcesPreferredTypes: asString,
        externalSourcesEmbedCss: asString,
        store: asStore,
        cameraMirror: asBoolean2,
        cameraCapture: asCameraCapture,
        sourceList: asString,
        topLevelOrigin: asString,
        maxLocalFileSizeBytes: asNumber2,
        thumbSize: asNumber2,
        showEmptyList: asBoolean2,
        useLocalImageEditor: asBoolean2,
        useCloudImageEditor: asBoolean2,
        cloudImageEditorTabs: asString,
        removeCopyright: asBoolean2,
        cropPreset: asString,
        imageShrink: asString,
        modalScrollLock: asBoolean2,
        modalBackdropStrokes: asBoolean2,
        sourceListWrap: asBoolean2,
        remoteTabSessionKey: asString,
        cdnCname: asString,
        cdnCnamePrefixed: asString,
        baseUrl: asString,
        socialBaseUrl: asString,
        secureSignature: asString,
        secureExpire: asString,
        secureDeliveryProxy: asString,
        retryThrottledRequestMaxTimes: asNumber2,
        retryNetworkErrorMaxTimes: asNumber2,
        multipartMinFileSize: asNumber2,
        multipartChunkSize: asNumber2,
        maxConcurrentRequests: asNumber2,
        multipartMaxConcurrentRequests: asNumber2,
        multipartMaxAttempts: asNumber2,
        checkForUrlDuplicates: asBoolean2,
        saveUrlForRecurrentUploads: asBoolean2,
        groupOutput: asBoolean2,
        userAgentIntegration: asString,
        debug: asBoolean2,
        localeName: asString,
        metadata: asMetadata,
        tags: asTags,
        secureUploadsExpireThreshold: asNumber2,
        localeDefinitionOverride: (value) => asObject(value),
        secureUploadsSignatureResolver: (value) => asFunction(value),
        secureDeliveryProxyUrlResolver: (value) => asFunction(value),
        iconHrefResolver: (value) => asFunction(value),
        plugins: (value) => asArray(value),
        fileValidators: asArray,
        collectionValidators: asArray,
        validationTimeout: asNumber2,
        validationConcurrency: asNumber2,
        cameraModes: asCameraModes,
        defaultCameraMode: asCameraMode,
        enableAudioRecording: asBoolean2,
        enableVideoRecording: asBoolean2,
        mediaRecorderOptions: asObject,
        maxVideoRecordingDuration: asNumber2,
        filesViewMode: asFilesViewMode,
        gridShowFileNames: asBoolean2,
        cloudImageEditorAutoOpen: asBoolean2,
        cloudImageEditorMaskHref: asString,
        testMode: asBoolean2,
        qualityInsights: asBoolean2,
        pasteScope: asPasteScope,
        dynamicButtonShowFirstIcon: asBoolean2,
        dynamicButtonViewMode: asDynamicButtonViewMode,
    }
    var normalizeConfigValue = (key, value) => {
        if (typeof value === "undefined" || value === null) {
            return void 0
        }
        try {
            return mapping[key](value)
        } catch (reason) {
            console.error(`Invalid value for config key "${key}".`, reason)
            return initialConfig[key]
        }
    }

    // src/blocks/Config/Config.ts
    var allConfigKeys = [
        // "debug" option should go first to be able to print debug messages from the very beginning
        .../* @__PURE__ */ new Set(["debug", ...Object.keys(initialConfig)]),
    ]
    var complexConfigKeys = [
        "metadata",
        "tags",
        "plugins",
        "localeDefinitionOverride",
        "secureUploadsSignatureResolver",
        "secureDeliveryProxyUrlResolver",
        "iconHrefResolver",
        "fileValidators",
        "collectionValidators",
        "mediaRecorderOptions",
    ]
    var isComplexKey = (key) => complexConfigKeys.includes(key)
    var plainConfigKeys = allConfigKeys.filter((key) => !isComplexKey(key))
    var builtinAttrKeyMapping = {
        ...Object.fromEntries(
            plainConfigKeys.map((key) => [toKebabCase(key), key])
        ),
        ...Object.fromEntries(
            plainConfigKeys.map((key) => [key.toLowerCase(), key])
        ),
    }
    var getLocalPropName = (key) => `__${key}`
    var Config = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.init$ = {
                ...this.init$,
                ...Object.fromEntries(
                    Object.entries(initialConfig).map(([key, value]) => [
                        sharedConfigKey(key),
                        value,
                    ])
                ),
            }
            this.Vj = /* @__PURE__ */ new Map()
            /**
             * Mapping of attribute names to custom config keys for plugin-registered configs.
             * Updated dynamically when plugins are registered or changed.
             * Similar to builtinAttrKeyMapping but for custom configs.
             */
            this.Kb = {}
            /** Set of all custom config names registered by plugins */
            this.Kg = /* @__PURE__ */ new Set()
            /**
             * Map of custom config subscriptions (config name -> unsubscribe function)
             * Used to track and clean up subscriptions when plugins change
             */
            this.ob = /* @__PURE__ */ new Map()
        }
        /**
         * Check if a key is a custom config (registered by plugins)
         */
        me(key) {
            return this.Kg.has(key)
        }
        /**
         * Get the custom config definition for a key
         */
        ne(key) {
            const pluginManager = this.a.pluginManager
            if (!pluginManager) return void 0
            return pluginManager.configRegistry.get(key)
        }
        /**
         * Get attribute names for a config key (kebab-case and lowercase)
         */
        oe(key) {
            return [
                .../* @__PURE__ */ new Set([
                    toKebabCase(key),
                    key.toLowerCase(),
                ]),
            ]
        }
        Wj(key, value) {
            if (isComplexKey(key)) {
                return
            }
            if (this.me(key)) {
                const config2 = this.ne(key)
                if (config2?.attribute === false) {
                    return
                }
            }
            const attrs = this.oe(key)
            for (const attr of attrs) {
                if (typeof value === "undefined" || value === null) {
                    this.removeAttribute(attr)
                } else if (this.getAttribute(attr) !== value.toString()) {
                    this.setAttribute(attr, value.toString())
                }
            }
        }
        Xj(key, value) {
            const stateKey = sharedConfigKey(key)
            if (this.$[stateKey] !== value) {
                if (typeof value === "undefined" || value === null) {
                    const defaultValue = initialConfig[key]
                    this.$[stateKey] =
                        defaultValue !== void 0 ? defaultValue : value
                } else {
                    this.$[stateKey] = value
                }
            }
        }
        Ca(key, value) {
            let normalizedValue
            if (this.me(key)) {
                const config2 = this.ne(key)
                try {
                    normalizedValue = config2?.normalize?.(value) ?? value
                } catch (error) {
                    console.warn(
                        `[uc-config] normalize() for "${key}" threw an error, keeping previous value`,
                        error
                    )
                    return
                }
            } else {
                normalizedValue = normalizeConfigValue(key, value)
            }
            const anyThis = this
            const localPropName = getLocalPropName(key)
            if (anyThis[localPropName] === normalizedValue) return
            this.Yj(key, anyThis[localPropName], normalizedValue)
            anyThis[localPropName] = normalizedValue
            this.Wj(key, normalizedValue)
            this.Xj(key, normalizedValue)
            this.debugPrint(`"${key}"`, normalizedValue)
            if (!this.me(key)) {
                runAssertions(this.cfg)
            }
        }
        Kc(key) {
            const anyThis = this
            const localPropName = getLocalPropName(key)
            return anyThis[localPropName] ?? this.$[sharedConfigKey(key)]
        }
        Yj(key, previousValue, nextValue2) {
            if (this.cfg.debug) {
                if (
                    nextValue2 !== previousValue &&
                    typeof nextValue2 === "object" &&
                    typeof previousValue === "object" &&
                    JSON.stringify(nextValue2) === JSON.stringify(previousValue)
                ) {
                    console.warn(
                        `[uc-config] Option "${key}" value is the same as the previous one but the reference is different`
                    )
                    console.warn(
                        `[uc-config] You should avoid changing the reference of the object to prevent unnecessary calculations`
                    )
                    console.warn(
                        `[uc-config] "${key}" previous value:`,
                        previousValue
                    )
                    console.warn(`[uc-config] "${key}" new value:`, nextValue2)
                }
            }
        }
        Lg(pluginManager) {
            const customConfigs = pluginManager.configRegistry.getAll()
            this.Kb = {}
            this.Kg = new Set(customConfigs.keys())
            for (const [name, unsub] of this.ob) {
                if (!customConfigs.has(name)) {
                    unsub()
                    this.ob.delete(name)
                }
            }
            for (const [name, definition] of customConfigs) {
                const configKey = name
                const stateKey = sharedConfigKey(configKey)
                if (definition.attribute) {
                    const attrNames = this.oe(name)
                    for (const attrName of attrNames) {
                        this.Kb[attrName] = name
                    }
                }
                let preExistingValue
                let hasPreExistingValue = false
                const existingDescriptor = Object.getOwnPropertyDescriptor(
                    this,
                    name
                )
                const isExistingDataDescriptor =
                    !!existingDescriptor &&
                    !existingDescriptor.get &&
                    !existingDescriptor.set
                if (
                    isExistingDataDescriptor &&
                    existingDescriptor.value !== void 0
                ) {
                    preExistingValue = existingDescriptor.value
                    hasPreExistingValue = true
                }
                if (!hasPreExistingValue && !!definition.attribute) {
                    for (const attrName of this.oe(name)) {
                        const attrValue = this.getAttribute(attrName)
                        if (attrValue !== void 0 && attrValue !== null) {
                            try {
                                preExistingValue = definition.fromAttribute
                                    ? definition.fromAttribute(attrValue)
                                    : attrValue
                            } catch (error) {
                                console.warn(
                                    `[uc-config] fromAttribute() for "${name}" threw an error, using raw attribute value`,
                                    error
                                )
                                preExistingValue = attrValue
                            }
                            hasPreExistingValue = true
                            break
                        }
                    }
                }
                if (!this.sharedCtx.has(stateKey)) {
                    this.sharedCtx.add(stateKey, definition.defaultValue)
                }
                const descriptor = Object.getOwnPropertyDescriptor(this, name)
                if (!descriptor || !descriptor.set || !descriptor.get) {
                    Object.defineProperty(this, name, {
                        set: (value) => {
                            this.Ca(name, value)
                        },
                        get: () => {
                            return this.Kc(name)
                        },
                        enumerable: true,
                        configurable: true,
                    })
                }
                if (!this.ob.has(name)) {
                    const unsub = this.sub(
                        stateKey,
                        (value) => {
                            this.Ca(name, value)
                        },
                        false
                    )
                    this.ob.set(name, unsub)
                }
                if (hasPreExistingValue) {
                    this.Ca(name, preExistingValue)
                }
            }
        }
        Zj() {
            this.a.when("pluginManager", (pluginManager) => {
                this.Lg(pluginManager)
                this.Jc = pluginManager.onPluginsChange(() => {
                    this.Lg(pluginManager)
                })
            })
        }
        _j() {
            this.Jb = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (
                        mutation.type === "attributes" &&
                        mutation.attributeName
                    ) {
                        const attrName = mutation.attributeName
                        const oldValue = mutation.oldValue
                        const newValue = this.getAttribute(attrName)
                        if (oldValue === newValue) continue
                        const isBuiltInAttr = attrName in builtinAttrKeyMapping
                        if (isBuiltInAttr) continue
                        if (attrName in this.Kb) {
                            const key = this.Kb[attrName]
                            const config2 = this.ne(key)
                            this.attributeChangedCallback(
                                attrName,
                                oldValue ?? "",
                                newValue ?? config2?.defaultValue ?? ""
                            )
                        }
                    }
                }
            })
            this.Jb.observe(this, {
                attributes: true,
                attributeOldValue: true,
            })
        }
        initCallback() {
            super.initCallback()
            const anyThis = this
            this.Zj()
            this._j()
            for (const key of plainConfigKeys) {
                this.sub(
                    sharedConfigKey(key),
                    (value) => {
                        this.Ca(key, value)
                    },
                    false
                )
            }
            for (const key of allConfigKeys) {
                const initialValue =
                    anyThis[key] ?? this.$[sharedConfigKey(key)]
                if (initialValue !== initialConfig[key]) {
                    this.Ca(key, initialValue)
                }
                const descriptor = Object.getOwnPropertyDescriptor(this, key)
                if (!descriptor || !descriptor.set || !descriptor.get) {
                    Object.defineProperty(this, key, {
                        set: (value) => {
                            this.Ca(key, value)
                        },
                        get: () => {
                            return this.Kc(key)
                        },
                    })
                }
            }
            const runComputeProperty = (key) => {
                computeProperty({
                    key,
                    setValue: this.Ca.bind(this),
                    getValue: this.Kc.bind(this),
                    computationControllers: this.Vj,
                })
            }
            for (const key of allConfigKeys) {
                this.sub(sharedConfigKey(key), () => runComputeProperty(key))
            }
        }
        attributeChangedCallback(name, oldVal, newVal) {
            super.attributeChangedCallback(name, oldVal, newVal)
            if (oldVal === newVal) return
            const anyThis = this
            const builtInKey = builtinAttrKeyMapping[name]
            if (builtInKey) {
                anyThis[builtInKey] = newVal
            } else {
                this.a.when("pluginManager", (pluginManager) => {
                    const currentAttrValue = this.getAttribute(name)
                    if (currentAttrValue && currentAttrValue !== newVal) {
                        return
                    }
                    const key = this.Kb[name]
                    const config2 = key
                        ? pluginManager.configRegistry.get(key)
                        : void 0
                    if (key && config2) {
                        const val = config2.fromAttribute
                            ? config2.fromAttribute(newVal)
                            : newVal
                        if (this.Kc(key) === val) return
                        this.Ca(key, val)
                    }
                })
            }
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            if (this.Jc) {
                this.Jc()
                this.Jc = void 0
            }
            if (this.Jb) {
                this.Jb.disconnect()
                this.Jb = void 0
            }
            for (const unsub of this.ob.values()) {
                unsub()
            }
            this.ob.clear()
        }
        static get observedAttributes() {
            const superObserved = super.observedAttributes
            const builtInAttrs = Object.keys(builtinAttrKeyMapping)
            return [...superObserved, ...builtInAttrs]
        }
    }
    for (const key of allConfigKeys) {
        Config.prototype[key] = void 0
    }

    // src/blocks/SimpleBtn/SimpleBtn.ts
    var SimpleBtn = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.dropzone = true
            this.Lb = "upload-file"
            this.pe = () => {
                this.api.initFlow()
            }
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-simple-btn"]
        }
        initCallback() {
            super.initCallback()
            this.subConfigValue("multiple", (val) => {
                this.Lb = val ? "upload-files" : "upload-file"
            })
        }
        render() {
            return b2`
    <uc-drop-area .disabled=${!this.dropzone}>
    <button type="button" @click=${this.pe}>
      <uc-icon name="upload"></uc-icon>
      <span>${this.l10n(this.Lb)}</span>
      ${this.yield("")}
      <div class="uc-visual-drop-area">${this.l10n("drop-files-here")}</div>
    </button>
  </uc-drop-area>
    `
        }
    }
    __decorateClass(
        [n5({ attribute: "dropzone", type: Boolean })],
        SimpleBtn.prototype,
        "dropzone",
        2
    )
    __decorateClass([r5()], SimpleBtn.prototype, /* @__KEY__ */ "Lb", 2)

    // node_modules/lit-html/directives/cache.js
    var d6 = (t7) => (d4(t7) ? t7.va.h : t7.strings)
    var h7 = e7(
        class extends i8 {
            constructor(t7) {
                ;(super(t7), (this.et = /* @__PURE__ */ new WeakMap()))
            }
            render(t7) {
                return [t7]
            }
            update(s11, [e11]) {
                const u6 = l4(this.it) ? d6(this.it) : null,
                    h8 = l4(e11) ? d6(e11) : null
                if (null !== u6 && (null === h8 || u6 !== h8)) {
                    const e12 = M2(s11).pop()
                    let o14 = this.et.get(u6)
                    if (void 0 === o14) {
                        const s12 = document.createDocumentFragment()
                        ;((o14 = D(A, s12)),
                            o14.setConnected(false),
                            this.et.set(u6, o14))
                    }
                    ;(p4(o14, [e12]), v2(o14, void 0, e12))
                }
                if (null !== h8) {
                    if (null === u6 || u6 !== h8) {
                        const t7 = this.et.get(h8)
                        if (void 0 !== t7) {
                            const i12 = M2(t7).pop()
                            ;(j2(s11), v2(s11, void 0, i12), p4(s11, [i12]))
                        }
                    }
                    this.it = e11
                } else this.it = void 0
                return this.render(e11)
            }
        }
    )

    // src/blocks/DynamicBtn/PrimaryAction.ts
    var _PrimaryAction = class _PrimaryAction extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.showIcon = false
            this.lb = false
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-primary-action"]
        }
        static {
            this.SOURCE_TEXT_CONFIG = {
                [UploadSource.LOCAL]: { action: "upload-from" },
                [UploadSource.URL]: { action: "upload-from" },
                [UploadSource.CAMERA]: { action: "capture-with" },
                [UploadSource.MOBILE_PHOTO_CAMERA]: { action: "take" },
                [UploadSource.MOBILE_VIDEO_CAMERA]: { action: "record" },
            }
        }
        initCallback() {
            super.initCallback()
            this.subConfigValue("dynamicButtonShowFirstIcon", (value) => {
                this.showIcon = value
            })
            this.subConfigValue("multiple", (value) => {
                this.lb = value
            })
        }
        get hasEntries() {
            return (this.entries?.allEntries?.length ?? 0) > 0
        }
        get hasSingleSuccessImage() {
            return (
                this.entries?.allEntries?.length === 1 &&
                this.entries.isSuccess &&
                (this.entries.allEntries[0]?.isImage ?? false)
            )
        }
        get hasMultipleEntries() {
            return (this.entries?.allEntries?.length ?? 0) >= 1
        }
        get localizedSourceLabel() {
            if (!this.source?.label) return ""
            if (["local", "url", "camera"].includes(this.source?.id)) {
                return this.l10n(this.source.label).toLowerCase()
            }
            return this.l10n(this.source.label)
        }
        Mb(key, params) {
            return this.l10n(key, params)
        }
        get textBasedOnLocale() {
            const headerText = this.$j()
            if (headerText) {
                return headerText
            }
            return this.ak()
        }
        $j() {
            if (this.entries?.status === "uploading") {
                return this.Mb("header-uploading", {
                    count: this.entries.uploadingCount,
                })
            }
            if (this.entries?.status === "failed") {
                return this.Mb("header-failed", {
                    count: this.entries.failedCount,
                })
            }
            if (this.entries?.status === "success") {
                return this.Mb("header-succeed", {
                    count: this.entries.successCount,
                })
            }
            if (this.entries?.totalCount > 0) {
                return this.Mb("header-total", {
                    count: this.entries?.totalCount ?? 0,
                })
            } else {
                return void 0
            }
        }
        ak() {
            if (!this.source?.id) {
                return ""
            }
            const config2 = _PrimaryAction.SOURCE_TEXT_CONFIG[this.source.id]
            const action = config2?.action ?? "get-from"
            let sourceLabel
            if (this.source.id === UploadSource.MOBILE_PHOTO_CAMERA) {
                sourceLabel = this.l10n("photo").toLowerCase()
            } else if (this.source.id === UploadSource.MOBILE_VIDEO_CAMERA) {
                sourceLabel = this.l10n("video").toLowerCase()
            } else {
                sourceLabel = this.localizedSourceLabel
            }
            return this.Mb(action, { source: sourceLabel })
        }
        pe() {
            if (this.hasEntries) {
                this.a.ctx.pub("*currentActivity", "upload-list")
                this.a.modalManager?.open("upload-list")
                return
            }
            void this.source?.onClick()
        }
        bk() {
            if (!this.lb && this.hasSingleSuccessImage) {
                const entry = this.entries.allEntries[0]
                if (!entry) return null
                return b2`<uc-thumb .uid=${entry.internalId}></uc-thumb>`
            }
            if (this.lb && this.hasMultipleEntries) {
                return null
            }
            const iconName = this.source?.icon
            return this.showIcon && iconName
                ? b2`<uc-icon .name=${iconName}></uc-icon>`
                : null
        }
        render() {
            return b2`
      <button type="button" @click=${this.pe} aria-label=${this.textBasedOnLocale}>
        ${this.bk()}
        <span>${this.textBasedOnLocale}</span>
      </button>
    `
        }
    }
    __decorateClass(
        [n5({ type: Object })],
        _PrimaryAction.prototype,
        "source",
        2
    )
    __decorateClass(
        [n5({ type: Object })],
        _PrimaryAction.prototype,
        "entries",
        2
    )
    __decorateClass([r5()], _PrimaryAction.prototype, "showIcon", 2)
    __decorateClass([r5()], _PrimaryAction.prototype, /* @__KEY__ */ "lb", 2)
    var PrimaryAction = _PrimaryAction

    // src/blocks/DropDown/DropDown.ts
    var DropDown = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.Mg = UID.generateFastUid()
            this.ck = (e11) => {
                e11.currentTarget.hidePopover()
            }
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-drop-down"]
        }
        render() {
            return b2`
      <button type="button" class="uc-mini-btn uc-dropdown-btn" popovertarget=${this.Mg} popovertargetaction="toggle">
        ${this.yield("dd-header-button")}
      </button>

      <div id=${this.Mg} class="uc-dropdown-content" popover="auto" @click=${this.ck}>
        ${this.yield("dd-content")}
      </div>
    `
        }
    }
    __decorateClass([r5()], DropDown.prototype, /* @__KEY__ */ "Mg", 2)

    // src/blocks/DynamicBtn/NoWrapModeDynamicBtn.ts
    var NoWrapModeDynamicBtn = class extends LitUploaderBlock {
        static {
            this.styleAttrs = [
                ...super.styleAttrs,
                "uc-no-wrap-mode-dynamic-btn",
            ]
        }
    }

    // src/blocks/DynamicBtn/DynamicBtn.ts
    var adjustSourceBasedOnMode = (sources, mode) => {
        if (mode === "compact" || sources.length === 0) {
            return {
                main: null,
                remain: sources,
            }
        }
        return {
            main: sources[0] ?? null,
            remain: sources.slice(1),
        }
    }
    var iconsBasedOnMode = {
        compact: "paperclip",
        menu: "arrow-dropdown",
        auto: "arrow-dropdown",
    }
    var AUTO_MODE_INLINE_THRESHOLD = 3
    var DynamicBtn = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.dropzone = true
            this.Ta = "auto"
            this.r = []
            this.pb = "idle"
            this.Og = 0
            this.K = throttle(() => {
                if (!this.isConnected) {
                    return
                }
                this.dk()
            }, 300)
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-dynamic-btn"]
        }
        get isIdle() {
            return this.pb === "idle"
        }
        get isSuccess() {
            return this.pb === "success"
        }
        get isFailed() {
            return this.pb === "failed"
        }
        get isUploading() {
            return this.pb === "uploading"
        }
        get isCollapsedMode() {
            return this.Ta === "compact"
        }
        get shouldShowPrimaryAction() {
            return (
                !this.isCollapsedMode ||
                !this.isIdle ||
                this.hasCollectionEntries
            )
        }
        get shouldShowInline() {
            return (
                this.isIdle &&
                !this.hasCollectionEntries &&
                this.r.length > 1 &&
                (this.Ta === "toolbar" ||
                    (this.Ta === "auto" &&
                        this.r.length <= AUTO_MODE_INLINE_THRESHOLD))
            )
        }
        get shouldShowDropdown() {
            return (
                this.isIdle &&
                !this.shouldShowInline &&
                !this.shouldShowCompactSingleSource &&
                !this.hasCollectionEntries &&
                (this.r.length > 1 || this.isCollapsedMode)
            )
        }
        get shouldShowCompactSingleSource() {
            return (
                this.isIdle &&
                this.isCollapsedMode &&
                !this.hasCollectionEntries &&
                this.r.length === 1
            )
        }
        get hasCollectionEntries() {
            return (this.Mc?.allEntries?.length ?? 0) > 0
        }
        get shouldShowAbortAction() {
            return !this.isIdle && this.hasCollectionEntries
        }
        dk() {
            const collectionState = this.api?.getOutputCollectionState()
            if (!collectionState) {
                console.warn("Collection state is undefined")
                return
            }
            this.Mc = collectionState
            this.pb = collectionState.status
        }
        Pg() {
            this.Lc = adjustSourceBasedOnMode(this.r, this.Ta)
        }
        initCallback() {
            super.initCallback()
            this.subConfigValue("dynamicButtonViewMode", (value) => {
                if (this.Ta === value) return
                this.Ta = value
                this.Pg()
            })
            this.sub("*commonProgress", (progress) => {
                this.Og = progress
            })
            new SourceListController(this, {
                ctx: this.a.ctx,
                sharedInstancesBag: this.a,
                onSourcesChange: (sources) => {
                    this.r = sources
                    this.Pg()
                },
            })
            this.uploadCollection.observeProperties(this.K)
            this.uploadCollection.observeCollection(this.K)
            this.Ng = this.routerLayer.registerAfterFileAddHook(
                ({ historyLength }) => {
                    if (this.cfg.confirmUpload) {
                        this.a.ctx.pub(
                            "*currentActivity",
                            ACTIVITY_TYPES.UPLOAD_LIST
                        )
                        this.modalManager?.open(ACTIVITY_TYPES.UPLOAD_LIST)
                        return true
                    }
                    if (historyLength > 0) return false
                    const currentActivity = this.a.ctx.read("*currentActivity")
                    if (currentActivity) {
                        this.modalManager?.close(currentActivity)
                    } else {
                        this.modalManager?.closeAll()
                    }
                    this.a.ctx.pub("*currentActivity", null)
                    return true
                }
            )
        }
        disconnectedCallback() {
            if (typeof this.K.cancel === "function") {
                this.K.cancel()
            }
            this.Ng?.()
            super.disconnectedCallback()
        }
        ek() {
            return b2`
      <uc-no-wrap-mode-dynamic-btn>
        ${this.Lc?.remain?.map(
            (source) =>
                b2`<uc-source-btn .iconOnly=${true} role="menuitem" .source=${source}></uc-source-btn>`
        )}
      </uc-no-wrap-mode-dynamic-btn>
    `
        }
        fk() {
            return iconsBasedOnMode[this.Ta] ?? "arrow-dropdown"
        }
        gk() {
            this.uploadCollection.clearAll()
        }
        hk() {
            this.Mc.failedEntries.forEach((it) => {
                if (it && this.uploadCollection.hasItem(it.internalId)) {
                    this.uploadCollection.remove(it.internalId)
                }
            })
        }
        ik() {
            this.uploadCollection.abortAll()
        }
        de() {
            switch (this.pb) {
                case "failed":
                    this.hk()
                    break
                case "uploading":
                    this.ik()
                    break
                default:
                    this.gk()
            }
        }
        jk() {
            return b2` <uc-drop-down>
      <uc-icon content-for="dd-header-button" name=${this.fk()}></uc-icon>
      <div content-for="dd-content" role="menu" class="uc-dropdown-menu">
        ${this.Lc?.remain?.map((source) => b2`<uc-source-btn role="menuitem" .source=${source}></uc-source-btn>`)}
      </div>
    </uc-drop-down>`
        }
        kk() {
            const source = this.r[0]
            const compactSource = source
                ? { ...source, icon: iconsBasedOnMode.compact }
                : source
            return b2`
      <uc-no-wrap-mode-dynamic-btn>
        <uc-source-btn .iconOnly=${true} .source=${compactSource}></uc-source-btn>
      </uc-no-wrap-mode-dynamic-btn>
    `
        }
        lk() {
            return b2`<uc-primary-action
      .entries=${this.Mc}
      .source=${this.Lc?.main}
    ></uc-primary-action>`
        }
        mk() {
            return b2`<uc-file-action-button
      @uc:remove=${this.de}
      .uploading=${this.isUploading}
      .failed=${this.isFailed}
      .success=${this.isSuccess}
      .idle=${this.isIdle}
      .progress=${this.Og}
    ></uc-file-action-button>`
        }
        nk() {
            return e10({
                "uc-dynamic-btn-inner": true,
                "uc-failed": this.isFailed,
                "uc-uploading": this.isUploading,
                "uc-success": this.isSuccess,
            })
        }
        pk() {
            return b2`
      <div class="uc-visual-drop-area">
        <uc-icon name="arrow-down"></uc-icon>
      </div>
    `
        }
        render() {
            return b2`
      <uc-drop-area .disabled=${!this.dropzone}>
        <div class=${this.nk()}>
          ${h7(this.shouldShowPrimaryAction ? this.lk() : null)}
          ${h7(this.shouldShowInline ? this.ek() : null)}
          ${h7(this.shouldShowCompactSingleSource ? this.kk() : null)}
          ${h7(this.shouldShowDropdown ? this.jk() : null)}
          ${h7(this.shouldShowAbortAction || this.hasCollectionEntries ? this.mk() : null)}
          ${h7(this.pk())}
        </div>
      </uc-drop-area>
    `
        }
    }
    __decorateClass(
        [n5({ attribute: "dropzone", type: Boolean })],
        DynamicBtn.prototype,
        "dropzone",
        2
    )
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "Ta", 2)
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "r", 2)
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "pb", 2)
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "Lc", 2)
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "Mc", 2)
    __decorateClass([r5()], DynamicBtn.prototype, /* @__KEY__ */ "Og", 2)

    // src/blocks/PluginActivityRenderer/PluginActivityRenderer.ts
    var PluginActivityHost = class extends LitActivityBlock {
        constructor() {
            super(...arguments)
            this.re = e9()
        }
        initCallback() {
            this.activityType = this.registration?.id ?? null
            this.Qg()
            super.initCallback()
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (changedProperties.has("registration")) {
                this.Qg()
                if (this.isActivityActive) {
                    this.Nc()
                    this.Rg()
                }
            }
        }
        Qg() {
            if (!this.registration) {
                return
            }
            if (this.Rf()) {
                return
            }
            this.registerActivity(this.activityType ?? "", {
                onActivate: () => this.Rg(),
                onDeactivate: () => this.Nc(),
            })
        }
        async Rg() {
            await this.updateComplete
            const container = this.re.value
            if (!container || !this.registration) {
                return
            }
            this.Nc()
            const activityParams = this.$["*currentActivityParams"]
            try {
                this.qe =
                    this.registration.render(container, activityParams) ??
                    void 0
            } catch (error) {
                console.error(
                    `[Plugin "${this.registration.pluginId}"] Activity render() threw an error`,
                    error
                )
            }
        }
        Nc() {
            const container = this.re.value
            if (container) {
                try {
                    this.qe?.()
                } catch (error) {
                    console.error(
                        `[Plugin "${this.registration?.pluginId}"] Activity dispose threw an error`,
                        error
                    )
                }
                this.qe = void 0
                container.replaceChildren()
            }
        }
        disconnectedCallback() {
            this.Nc()
            super.disconnectedCallback()
        }
        render() {
            return b2`<div style="display: contents;" ${n7(this.re)}></div>`
        }
    }
    __decorateClass(
        [n5({ attribute: false })],
        PluginActivityHost.prototype,
        "registration",
        2
    )
    var PluginActivityRenderer = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.mode = "modal"
            this.ma = []
        }
        initCallback() {
            super.initCallback()
            const pluginManager = this.a.pluginManager
            if (pluginManager?.onPluginsChange) {
                this.w = pluginManager.onPluginsChange(() => this.Sg())
            }
            this.Sg()
        }
        Sg() {
            const pluginManager = this.a.pluginManager
            if (!pluginManager) {
                this.ma = []
                return
            }
            this.ma = pluginManager.snapshot().activities
        }
        disconnectedCallback() {
            this.w?.()
            this.w = void 0
            super.disconnectedCallback()
        }
        render() {
            if (this.mode === "inline") {
                return b2`${c8(
                    this.ma,
                    (activity) => activity.id,
                    (activity) =>
                        b2`<uc-plugin-activity-host .registration=${activity}></uc-plugin-activity-host>`
                )}`
            }
            return b2`${c8(
                this.ma,
                (activity) => activity.id,
                (activity) => b2`
        <uc-modal id=${activity.id} strokes block-body-scrolling>
          <uc-plugin-activity-host .registration=${activity}></uc-plugin-activity-host>
        </uc-modal>
      `
            )}`
        }
    }
    __decorateClass(
        [n5({ type: String })],
        PluginActivityRenderer.prototype,
        "mode",
        2
    )
    __decorateClass(
        [r5()],
        PluginActivityRenderer.prototype,
        /* @__KEY__ */ "ma",
        2
    )

    // node_modules/lit-html/directives/when.js
    function n9(n10, r8, t7) {
        return n10 ? r8(n10) : t7?.(n10)
    }

    // src/blocks/CloudImageEditor/src/lib/classNames.ts
    function normalize(...args) {
        return args.reduce((result, arg) => {
            if (typeof arg === "string") {
                result[arg] = true
                return result
            }
            for (const token of Object.keys(arg)) {
                result[token] = arg[token]
            }
            return result
        }, {})
    }
    function classNames(...args) {
        const mapping2 = normalize(...args)
        return Object.keys(mapping2)
            .reduce((result, token) => {
                if (mapping2[token]) {
                    result.push(token)
                }
                return result
            }, [])
            .join(" ")
    }
    function applyClassNames(element, ...args) {
        const mapping2 = normalize(...args)
        for (const token of Object.keys(mapping2)) {
            element.classList.toggle(token, Boolean(mapping2[token]))
        }
    }

    // src/blocks/CloudImageEditor/src/lib/parseTabs.ts
    var isTabIdValue = (value) => ALL_TABS.includes(value)
    var parseTabs = (tabs) => {
        if (!tabs) {
            return ALL_TABS
        }
        const tabList = deserializeCsv(tabs).filter(isTabIdValue)
        if (tabList.length === 0) {
            return ALL_TABS
        }
        return tabList
    }

    // src/blocks/CloudImageEditor/src/state.ts
    function initState(fnCtx) {
        return {
            "*originalUrl": null,
            "*loadingOperations": /* @__PURE__ */ new Map(),
            "*faderEl": null,
            "*cropperEl": null,
            "*imgEl": null,
            "*imgContainerEl": null,
            "*networkProblems": false,
            "*imageSize": null,
            "*editorTransformations": {},
            "*cropPresetList": [],
            "*currentAspectRatio": null,
            "*tabList": ALL_TABS,
            "*tabId": TabId.CROP,
            // TODO: beware of wrong ctx in case of element re-creation:
            "*on.retryNetwork": () => {
                const images = fnCtx.querySelectorAll("img")
                for (const img of images) {
                    const originalSrc = img.src
                    img.src = TRANSPARENT_PIXEL_SRC
                    img.src = originalSrc
                }
                fnCtx.$["*networkProblems"] = false
            },
            "*on.apply": (transformations) => {
                if (!transformations) {
                    return
                }
                const originalUrl = fnCtx.$["*originalUrl"]
                if (!originalUrl) {
                    console.warn(
                        "Original URL is null, cannot apply transformations"
                    )
                    return
                }
                const cdnUrlModifiers = createCdnUrlModifiers(
                    transformationsToOperations(transformations),
                    "preview"
                )
                const cdnUrl = createCdnUrl(originalUrl, cdnUrlModifiers)
                const eventData = {
                    originalUrl,
                    cdnUrlModifiers,
                    cdnUrl,
                    transformations,
                }
                fnCtx.dispatchEvent(
                    new CustomEvent("apply", {
                        detail: eventData,
                        bubbles: true,
                        composed: true,
                    })
                )
                fnCtx.remove()
            },
            "*on.cancel": () => {
                fnCtx.remove()
                fnCtx.dispatchEvent(
                    new CustomEvent("cancel", {
                        bubbles: true,
                        composed: true,
                    })
                )
            },
        }
    }

    // src/blocks/CloudImageEditor/src/svg-sprite.ts
    var svg_sprite_default2 =
        "<svg width='0' height='0' style='position:absolute'><symbol fill='none' viewBox='0 0 24 24' id='uc-icon-arrow-dropdown' xmlns='http://www.w3.org/2000/svg'><path d='M19.248 9.561 12 16.003 4.752 9.561l.996-1.122L12 13.995l6.252-5.556z' fill='currentColor'/></symbol><symbol viewBox='0 0 24 24' id='uc-icon-aspect-ratio' xmlns='http://www.w3.org/2000/svg'/><symbol viewBox='0 0 20 20' id='uc-icon-brightness' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M15 10a5 5 0 0 1-5 5m5-5a5 5 0 0 0-5-5m5 5h-5m0 5a5 5 0 0 1 0-10m0 10V5m0 15v-3M2.93 2.929 5.05 5.05M0 10h3m-.07 7.071 2.12-2.121M10 0v3m7.07 14.071-2.12-2.121M20 10h-3m.07-7.071L14.95 5.05m-.626 2.45H10m4.324 5H10'/></symbol><symbol fill='currentColor' viewBox='0 0 20 20' id='uc-icon-closeMax' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' d='M8.232 10 3.585 5.353l1.768-1.768L10 8.232l4.648-4.647 1.767 1.768L11.768 10l4.647 4.648-1.767 1.767L10 11.768l-4.647 4.647-1.768-1.767L8.232 10Z' clip-rule='evenodd'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-contrast' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M2 10a8 8 0 1 0 16 0 8 8 0 1 0-16 0m8-8v16m8-8h-8m7.598 2.5H10m6.24 2.5H10m7.6-7.5H10M16.242 5H10'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-crop' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M20 14H7.005C6.45 14 6 13.55 6 12.995V0M0 6h13.067c.515 0 .933.418.933.933V20M14.5.4 13 2l1.5 1.6M13 2h2a3 3 0 0 1 3 3v2M5.5 19.6 7 18l-1.5-1.6M7 18H5a3 3 0 0 1-3-3v-2'/></symbol><symbol fill='currentColor' viewBox='0 0 20 20' id='uc-icon-done' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' d='m18.057 6.333-9.365 9.125a1.25 1.25 0 0 1-1.768-.023L1.92 10.296l1.791-1.744 4.132 4.243 8.47-8.253 1.744 1.79Z' clip-rule='evenodd'/></symbol><symbol fill='currentColor' viewBox='0 0 25 24' id='uc-icon-edit-file' xmlns='http://www.w3.org/2000/svg'><path fill-rule='evenodd' d='M18.558 2.804a.78.78 0 0 0-.557.235l-.008.007-2.472 2.46 3.847 3.848 2.46-2.473.004-.003a.78.78 0 0 0 0-1.108l-.004-.003-2.712-2.728a.78.78 0 0 0-.558-.235Zm-.248 7.613-3.852-3.852-8.93 8.887-1.516 5.41 5.41-1.515 8.888-8.93Zm-.636-8.934a2.28 2.28 0 0 1 2.512.505l2.702 2.717.002.002a2.278 2.278 0 0 1 0 3.234l-.002.002-12.541 12.602a.75.75 0 0 1-.33.193l-6.884 1.928a.75.75 0 0 1-.925-.924l1.928-6.885a.75.75 0 0 1 .193-.33l12.603-12.54a2.28 2.28 0 0 1 .742-.504Z' clip-rule='evenodd'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-enhance' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M19 13h-2m0 0a4 4 0 0 1-4-4m4 4a4 4 0 0 0-4 4m0-8V7m0 2a4 4 0 0 1-4 4m-2 0h2m0 0a4 4 0 0 1 4 4m0 0v2M8 8.5H6.5m0 0a2 2 0 0 1-2-2m2 2a2 2 0 0 0-2 2m0-4V5m0 1.5a2 2 0 0 1-2 2M1 8.5h1.5m0 0a2 2 0 0 1 2 2m0 0V12M12 3h-1m0 0a1 1 0 0 1-1-1m1 1a1 1 0 0 0-1 1m0-2V1m0 1a1 1 0 0 1-1 1M8 3h1m0 0a1 1 0 0 1 1 1m0 0v1'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-exposure' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M10 20v-3M2.93 2.929 5.05 5.05M0 10h3m-.07 7.071 2.12-2.121M10 0v3m7.07 14.071-2.12-2.121M20 10h-3m.07-7.071L14.95 5.05M5 10a5 5 0 1 0 10 0 5 5 0 1 0-10 0'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-filters' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M4.5 6.5a5.5 5.5 0 1 0 11 0 5.5 5.5 0 1 0-11 0m-3.5 6a5.5 5.5 0 1 0 11 0 5.5 5.5 0 1 0-11 0m7 0a5.5 5.5 0 1 0 11 0 5.5 5.5 0 1 0-11 0'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-flip' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M19.6 5 18 3.5 16.4 5m3.2 10L18 16.5 16.4 15M18 3.523v12.954M3.3 8.5h10.654c.301 0 .415-.395.159-.554L3.459 1.286A.3.3 0 0 0 3 1.542V8.2a.3.3 0 0 0 .3.3zm0 3h10.654c.301 0 .415.395.159.554l-10.654 6.66A.3.3 0 0 1 3 18.458v-6.66a.3.3 0 0 1 .3-.3z'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-gamma' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M17 3C9 6 2.5 11.5 2.5 17.5m0 0h1m-1 0v-1m14 1h1m-3 0h1m-3 0h1m-3 0h1m-3 0h1m-3 0h1m-3 0h1m-3-14v-1m0 3v-1m0 3v-1m0 3v-1m0 3v-1m0 3v-1m0 3v-1'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-mirror' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M5 .4 3.5 2 5 3.6M15 .4 16.5 2 15 3.6M3.52 2h12.957M8.5 16.7V6.046c0-.301-.394-.415-.554-.159L1.287 16.541a.3.3 0 0 0 .255.459H8.2a.3.3 0 0 0 .3-.3zm3 0V6.046c0-.301.395-.415.555-.159l6.659 10.654a.3.3 0 0 1-.255.459H11.8a.3.3 0 0 1-.3-.3z'/></symbol><symbol viewBox='0 0 40 40' id='uc-icon-original' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.5' d='M0 40 40 0'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-rotate' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M13.5.4 12 2l1.5 1.6M12.023 2H14.4A3.6 3.6 0 0 1 18 5.6V8M4 17h9a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1z'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-sad' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M2 17c4.418-4 11.582-4 16 0M16.5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-11 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-saturation' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='ruc-icon-id__a' x1='10.001' y1='1' x2='10.001' y2='19' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient></defs><circle cx='10.001' cy='10' r='9' transform='rotate(90 10 10)' fill='url(#ruc-icon-id__a)'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-slider' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M0 10h11m0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m0 0h5'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-tuning' xmlns='http://www.w3.org/2000/svg'><path stroke-linejoin='round' fill='none' stroke='currentColor' stroke-width='1.2' d='M8 10h11M1 10h4M1 4.5h11m3 0h4m-18 11h11m3 0h4m-7-11a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0M5 10a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0m7 5.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0'/></symbol><symbol viewBox='0 0 20 20' id='uc-icon-vibrance' xmlns='http://www.w3.org/2000/svg'><path d='M2.125 5.64A8.96 8.96 0 0 0 1.001 10a8.96 8.96 0 0 0 1.124 4.36V5.64z' fill='url(#uuc-icon-id__a)'/><path d='M2.875 15.499V4.502a9.053 9.053 0 0 1 1.75-1.72v14.437a9.05 9.05 0 0 1-1.75-1.72z' fill='url(#uuc-icon-id__b)'/><path d='M5.375 17.722c.548.33 1.134.601 1.75.809V1.469a8.956 8.956 0 0 0-1.75.81v15.443z' fill='url(#uuc-icon-id__c)'/><path d='M7.875 1.253v17.495c.564.136 1.15.22 1.75.244V1.008a9 9 0 0 0-1.75.245z' fill='url(#uuc-icon-id__d)'/><path d='M10.375 1.008v17.984a9 9 0 0 0 1.75-.244V1.252a9 9 0 0 0-1.75-.244z' fill='url(#uuc-icon-id__e)'/><path d='M12.875 1.469V18.53a8.957 8.957 0 0 0 1.75-.808V2.277a8.957 8.957 0 0 0-1.75-.808z' fill='url(#uuc-icon-id__f)'/><path d='M15.375 2.78v14.44a9.053 9.053 0 0 0 1.75-1.72v-11a9.054 9.054 0 0 0-1.75-1.72z' fill='url(#uuc-icon-id__g)'/><path d='M17.875 5.638v8.724A8.959 8.959 0 0 0 19.001 10a8.96 8.96 0 0 0-1.126-4.362z' fill='url(#uuc-icon-id__h)'/><defs><linearGradient id='uuc-icon-id__a' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__b' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__c' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__d' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__e' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__f' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__g' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient><linearGradient id='uuc-icon-id__h' x1='19.001' y1='10' x2='1.001' y2='10' gradientUnits='userSpaceOnUse'><stop stop-color='#DE15FF'/><stop offset='.203' stop-color='#0029FF'/><stop offset='.479' stop-color='#2AE4F0'/><stop offset='.604' stop-color='#15EF11'/><stop offset='.75' stop-color='#FAE528'/><stop offset='1' stop-color='#EB2A2A'/></linearGradient></defs></symbol><symbol viewBox='0 0 20 20' id='uc-icon-warmth' xmlns='http://www.w3.org/2000/svg'><path d='m7.5 13.05.429.42.171-.175v-.244h-.6zm5 0h-.6v.245l.172.175.428-.42zM8.1 3.5c0-1.05.85-1.9 1.9-1.9V.4a3.1 3.1 0 0 0-3.1 3.1h1.2zm0 9.55V3.5H6.9v9.55h1.2zm-1 2.45c0-.79.315-1.506.829-2.03l-.858-.84A4.088 4.088 0 0 0 5.9 15.5h1.2zm2.9 2.9a2.9 2.9 0 0 1-2.9-2.9H5.9a4.1 4.1 0 0 0 4.1 4.1v-1.2zm2.9-2.9a2.9 2.9 0 0 1-2.9 2.9v1.2a4.1 4.1 0 0 0 4.1-4.1h-1.2zm-.829-2.03c.514.524.829 1.24.829 2.03h1.2c0-1.117-.447-2.13-1.171-2.87l-.858.84zM11.9 3.5v9.55h1.2V3.5h-1.2zM10 1.6c1.05 0 1.9.85 1.9 1.9h1.2A3.1 3.1 0 0 0 10 .4v1.2z' fill='currentColor'/><path d='M10 14V8' stroke='currentColor' stroke-width='1.2' stroke-linecap='round'/><path d='M14 3h3m-3 3h3m-3 3h3m-8 6.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0' stroke='currentColor' stroke-width='1.2'/></symbol></svg>"

    // src/blocks/CloudImageEditor/src/elements/presence-toggle/PresenceToggle.ts
    var DEFAULT_STYLE = {
        transition: "uc-transition",
        visible: "uc-visible",
        hidden: "uc-hidden",
    }
    var PresenceToggle = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.oa = false
            this.Tg = DEFAULT_STYLE
            this.Ug = DEFAULT_STYLE.visible
            this.Vg = DEFAULT_STYLE.hidden
            this.se = false
            this.Wg = false
        }
        set visible(value) {
            this.oa = value
            this.Xg()
        }
        get visible() {
            return this.oa
        }
        set styles(styles) {
            this.Tg = styles
            this.se = true
            this.Ug = styles.visible ?? DEFAULT_STYLE.visible
            this.Vg = styles.hidden ?? DEFAULT_STYLE.hidden
        }
        get styles() {
            return this.Tg
        }
        Xg() {
            this.style.visibility = this.oa ? "inherit" : "hidden"
            applyClassNames(this, {
                [DEFAULT_STYLE.transition]: !this.se,
                [this.Ug]: this.oa,
                [this.Vg]: !this.oa,
            })
            this.toggleAttribute("inert", !this.oa)
        }
        qk() {
            if (this.Wg) {
                return
            }
            this.Wg = true
            this.dispatchEvent(
                new CustomEvent("initial-render", {
                    bubbles: true,
                    composed: true,
                })
            )
        }
        initCallback() {
            super.initCallback()
            this.classList.toggle("uc-initial", true)
            if (!this.se) {
                this.classList.add(DEFAULT_STYLE.transition)
            }
            this.Xg()
            setTimeout(() => {
                this.classList.toggle("uc-initial", false)
                this.qk()
            }, 0)
        }
    }
    __decorateClass(
        [n5({ type: Boolean })],
        PresenceToggle.prototype,
        "visible",
        1
    )
    __decorateClass(
        [n5({ attribute: false })],
        PresenceToggle.prototype,
        "styles",
        1
    )

    // src/blocks/CloudImageEditor/src/elements/line-loader/LineLoaderUi.ts
    var LineLoaderUi = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.active = false
            this.Oc = e9()
            this.te = false
            this.ue = () => {
                const lineEl = this.Oc.value
                if (!lineEl) {
                    return
                }
                this.Yg(lineEl)
                if (this.te && this.active) {
                    this.ve()
                }
            }
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            if (this.active) {
                this.ve()
            }
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("active")) {
                if (this.active) {
                    this.ve()
                } else {
                    this.rk()
                }
            }
        }
        ve() {
            const lineEl = this.Oc.value
            if (!lineEl) {
                return
            }
            this.te = true
            const { width } = this.getBoundingClientRect()
            lineEl.removeEventListener("transitionend", this.ue)
            lineEl.style.transition = "transform 1s"
            lineEl.style.opacity = "1"
            lineEl.style.transform = `translateX(${width}px)`
            lineEl.addEventListener("transitionend", this.ue, {
                once: true,
            })
        }
        rk() {
            const lineEl = this.Oc.value
            if (!lineEl) {
                return
            }
            this.te = false
            lineEl.removeEventListener("transitionend", this.ue)
            this.Yg(lineEl)
        }
        Yg(lineEl) {
            lineEl.style.transition = "initial"
            lineEl.style.opacity = "0"
            lineEl.style.transform = "translateX(-101%)"
        }
        render() {
            return b2`
      <div class="uc-inner">
        <div class="uc-line" ${n7(this.Oc)}></div>
      </div>
    `
        }
    }
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        LineLoaderUi.prototype,
        "active",
        2
    )

    // node_modules/lit-html/directives/if-defined.js
    var o13 = (o14) => o14 ?? A

    // src/blocks/CloudImageEditor/src/elements/button/BtnUi.ts
    var BtnUi = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.text = ""
            this.icon = ""
            this.reverse = false
            this.theme = "default"
            this.ariaRole = void 0
            this.ariaControls = ""
            this.titleProp = ""
            this.active = false
        }
        firstUpdated(changed) {
            super.firstUpdated(changed)
            this.Zg()
            this._g()
        }
        updated(changed) {
            super.updated(changed)
            if (changed.has("reverse")) {
                this.Zg()
            }
            if (changed.has("theme")) {
                this._g()
            }
        }
        Zg() {
            this.style.flexDirection = this.reverse ? "row-reverse" : ""
        }
        _g() {
            if (this.theme && this.theme !== "custom") {
                this.className = `uc-${this.theme}`
            }
        }
        get sk() {
            const iconHidden = this.we
            return {
                "uc-icon": true,
                "uc-icon_left": !this.reverse,
                "uc-icon_right": this.reverse,
                "uc-icon_hidden": iconHidden,
                "uc-icon_single": this.tk,
            }
        }
        get we() {
            return !this.icon
        }
        get tk() {
            return !this.text && !this.we
        }
        render() {
            return b2`
      <button
        type="button"
        role=${o13(this.ariaRole || void 0)}
        aria-controls=${o13(this.ariaControls || void 0)}
        aria-label=${o13(this.l10n(this.titleProp))}
        title=${o13(this.l10n(this.titleProp))}
      >
        <uc-icon
          class=${e10(this.sk)}
          name=${o13(this.icon || void 0)}
          ?hidden=${this.we}
        ></uc-icon>
        <div class="uc-text">${this.text}</div>
      </button>
    `
        }
    }
    __decorateClass([n5({ type: String })], BtnUi.prototype, "text", 2)
    __decorateClass([n5({ type: String })], BtnUi.prototype, "icon", 2)
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        BtnUi.prototype,
        "reverse",
        2
    )
    __decorateClass(
        [n5({ type: String, reflect: true })],
        BtnUi.prototype,
        "theme",
        2
    )
    __decorateClass(
        [n5({ attribute: "aria-role" })],
        BtnUi.prototype,
        "ariaRole",
        2
    )
    __decorateClass(
        [n5({ attribute: "aria-controls" })],
        BtnUi.prototype,
        "ariaControls",
        2
    )
    __decorateClass(
        [n5({ attribute: "title-prop" })],
        BtnUi.prototype,
        "titleProp",
        2
    )
    __decorateClass(
        [n5({ type: Boolean, noAccessor: true })],
        BtnUi.prototype,
        "active",
        2
    )

    // src/blocks/CloudImageEditor/src/lib/pick.ts
    function pick(obj, keys) {
        const result = {}
        for (const key of keys) {
            const value = obj[key]
            if (Object.hasOwn(obj, key) || value !== void 0) {
                result[key] = value
            }
        }
        return result
    }

    // src/blocks/CloudImageEditor/src/util.ts
    function viewerImageSrc(originalUrl, width, transformations) {
        const MAX_CDN_DIMENSION = 3e3
        const dpr = window.devicePixelRatio
        const size = Math.min(Math.ceil(width * dpr), MAX_CDN_DIMENSION)
        const quality = dpr >= 2 ? "lightest" : "normal"
        return createCdnUrl(
            originalUrl,
            createCdnUrlModifiers(
                COMMON_OPERATIONS,
                transformationsToOperations(transformations),
                `quality/${quality}`,
                `stretch/off/-/resize/${size}x`,
                `@clib/${PACKAGE_NAME}/${PACKAGE_VERSION}/uc-cloud-image-editor/`
            )
        )
    }

    // src/blocks/CloudImageEditor/src/CropFrame.ts
    var CropFrame = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.$g = `uc-backdrop-mask-${UID.generateFastUid()}`
            this.Qc = false
            this.Qb = false
            this.ch = e9()
            this.Rb = false
            this.Sb = null
            this.eh = (e11) => {
                this.fh()
                if (!this.Tb) {
                    return
                }
                e11.stopPropagation()
                e11.preventDefault()
                this.Tb = false
            }
            this.gh = (e11) => {
                if (!this.Tb || !this.Pc || !this.ye) {
                    return
                }
                e11.stopPropagation()
                e11.preventDefault()
                const svg = this.Da
                if (!svg) {
                    return
                }
                const { x: svgX, y: svgY } = svg.getBoundingClientRect()
                const x2 = e11.x - svgX
                const y4 = e11.y - svgY
                const dx = x2 - this.Pc[0]
                const dy = y4 - this.Pc[1]
                const { direction } = this.ye
                const movedCropBox = this.Ck(direction, [dx, dy])
                if (movedCropBox) {
                    this.$["*cropBox"] = movedCropBox
                }
            }
            this.hh = (e11) => {
                if (!this.ua) return
                const hoverThumb = Object.values(this.ua).find((thumb) => {
                    if (!thumb) {
                        return false
                    }
                    if (this.Ae(thumb.direction)) {
                        return false
                    }
                    const node = thumb.interactionNode
                    const bounds = node.getBoundingClientRect()
                    const rect = {
                        x: bounds.x,
                        y: bounds.y,
                        width: bounds.width,
                        height: bounds.height,
                    }
                    const hover = rectContainsPoint(rect, [e11.x, e11.y])
                    return hover
                })
                this.ah = hoverThumb
                this.fh()
            }
        }
        get Da() {
            return this.ch.value ?? null
        }
        get Tb() {
            return this.Qb
        }
        set Tb(value) {
            if (this.Qb === value) {
                return
            }
            this.Qb = value
            this.ze()
        }
        ze() {
            if (!this.Ob) {
                return
            }
            this.Ob.setAttribute(
                "class",
                classNames({
                    "uc-guides--hidden": this.Qc,
                    "uc-guides--visible": !this.Qc && this.Qb,
                    "uc-guides--semi-hidden": !this.Qc && !this.Qb,
                })
            )
        }
        Ae(direction) {
            const imageBox = this.$["*imageBox"]
            if (!imageBox) {
                return false
            }
            if (
                direction === "" &&
                imageBox.height <= MIN_CROP_SIZE &&
                imageBox.width <= MIN_CROP_SIZE
            ) {
                return true
            }
            const tooHigh =
                imageBox.height <= MIN_CROP_SIZE &&
                (direction.includes("n") || direction.includes("s"))
            const tooWide =
                imageBox.width <= MIN_CROP_SIZE &&
                (direction.includes("e") || direction.includes("w"))
            return tooHigh || tooWide
        }
        uk() {
            const cropBox = this.$["*cropBox"]
            if (!cropBox) {
                return
            }
            const { x: x2, y: y4, width, height } = cropBox
            const svg = this.Da
            if (!svg) {
                return
            }
            const mask = createSvgNode("mask", { id: this.$g })
            const maskRectOuter = createSvgNode("rect", {
                x: 0,
                y: 0,
                width: "100%",
                height: "100%",
                fill: "white",
            })
            const maskRectInner = createSvgNode("rect", {
                x: x2,
                y: y4,
                width,
                height,
                fill: "black",
            })
            mask.appendChild(maskRectOuter)
            mask.appendChild(maskRectInner)
            const backdropRect = createSvgNode("rect", {
                x: 0,
                y: 0,
                width: "100%",
                height: "100%",
                fill: "var(--color-image-background)",
                "fill-opacity": 0.85,
                mask: `url(#${this.$g})`,
            })
            svg.appendChild(backdropRect)
            svg.appendChild(mask)
            this.Nb = mask
            this.xe = maskRectInner
        }
        /**
         * @private Super Tricky workaround for the chromium bug See
         *   https://bugs.chromium.org/p/chromium/issues/detail?id=330815
         */
        vk() {
            if (!this.Nb) {
                return
            }
            this.Nb.style.display = "none"
            window.requestAnimationFrame(() => {
                if (this.Nb) {
                    this.Nb.style.display = "block"
                }
            })
        }
        wk() {
            const cropBox = this.$["*cropBox"]
            if (!cropBox) {
                return
            }
            const { x: x2, y: y4, width, height } = cropBox
            this.xe && setSvgNodeAttrs(this.xe, { x: x2, y: y4, width, height })
        }
        xk() {
            const cropBox = this.$["*cropBox"]
            if (!cropBox || !this.Ob || !this.ua) {
                return
            }
            for (const thumb of Object.values(this.ua)) {
                if (!thumb) {
                    continue
                }
                const { direction, pathNode, interactionNode, groupNode } =
                    thumb
                const isCenter = direction === ""
                const isCorner = direction.length === 2
                const { x: x2, y: y4, width, height } = cropBox
                if (isCenter) {
                    const moveThumbRect = {
                        x: x2,
                        y: y4,
                        width,
                        height,
                    }
                    setSvgNodeAttrs(interactionNode, moveThumbRect)
                } else {
                    const thumbSizeMultiplier = clamp(
                        Math.min(width, height) /
                            (THUMB_CORNER_SIZE * 2 + THUMB_SIDE_SIZE) /
                            2,
                        0,
                        1
                    )
                    const pathInfo = isCorner
                        ? cornerPath(cropBox, direction, thumbSizeMultiplier)
                        : sidePath(cropBox, direction, thumbSizeMultiplier)
                    const center = pathInfo.center
                    if (!center) {
                        continue
                    }
                    const size = Math.max(
                        MAX_INTERACTION_SIZE *
                            clamp(
                                Math.min(width, height) /
                                    MAX_INTERACTION_SIZE /
                                    3,
                                0,
                                1
                            ),
                        MIN_INTERACTION_SIZE
                    )
                    setSvgNodeAttrs(interactionNode, {
                        x: center[0] - size,
                        y: center[1] - size,
                        width: size * 2,
                        height: size * 2,
                    })
                    setSvgNodeAttrs(pathNode, { d: pathInfo.d })
                }
                const disableThumb = this.Ae(direction)
                groupNode.setAttribute(
                    "class",
                    classNames("uc-thumb", {
                        "uc-thumb--hidden": disableThumb,
                        "uc-thumb--visible": !disableThumb,
                    })
                )
            }
            setSvgNodeAttrs(this.Ob, {
                x: cropBox.x - GUIDE_STROKE_WIDTH * 0.5,
                y: cropBox.y - GUIDE_STROKE_WIDTH * 0.5,
                width: cropBox.width + GUIDE_STROKE_WIDTH,
                height: cropBox.height + GUIDE_STROKE_WIDTH,
            })
        }
        dh(frameThumbs, direction) {
            const groupNode = createSvgNode("g")
            groupNode.classList.add("uc-thumb")
            groupNode.setAttribute("with-effects", "")
            const interactionNode = createSvgNode("rect", {
                fill: "transparent",
            })
            const pathNode = createSvgNode("path", {
                stroke: "currentColor",
                fill: "none",
                "stroke-width": THUMB_STROKE_WIDTH,
            })
            groupNode.appendChild(pathNode)
            groupNode.appendChild(interactionNode)
            frameThumbs[direction] = {
                direction,
                pathNode,
                interactionNode,
                groupNode,
            }
            if (direction === "") {
                groupNode.style.cursor = "move"
            }
            interactionNode.addEventListener(
                "pointerdown",
                this.yk.bind(this, direction)
            )
        }
        zk() {
            const frameThumbs = {}
            for (let i12 = 0; i12 < 3; i12++) {
                for (let j3 = 0; j3 < 3; j3++) {
                    const direction = `${["n", "", "s"][i12]}${["w", "", "e"][j3]}`
                    if (direction === "") {
                        continue
                    }
                    this.dh(frameThumbs, direction)
                }
            }
            this.dh(frameThumbs, "")
            return frameThumbs
        }
        Ak() {
            const svg = createSvgNode("svg")
            const rect = createSvgNode("rect", {
                x: 0,
                y: 0,
                width: "100%",
                height: "100%",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": GUIDE_STROKE_WIDTH,
                "stroke-opacity": 0.5,
            })
            svg.appendChild(rect)
            for (let i12 = 1; i12 <= 2; i12++) {
                const line = createSvgNode("line", {
                    x1: `${GUIDE_THIRD * i12}%`,
                    y1: `0%`,
                    x2: `${GUIDE_THIRD * i12}%`,
                    y2: `100%`,
                    stroke: "currentColor",
                    "stroke-width": GUIDE_STROKE_WIDTH,
                    "stroke-opacity": 0.3,
                })
                svg.appendChild(line)
            }
            for (let i12 = 1; i12 <= 2; i12++) {
                const line = createSvgNode("line", {
                    x1: `0%`,
                    y1: `${GUIDE_THIRD * i12}%`,
                    x2: `100%`,
                    y2: `${GUIDE_THIRD * i12}%`,
                    stroke: "currentColor",
                    "stroke-width": GUIDE_STROKE_WIDTH,
                    "stroke-opacity": 0.3,
                })
                svg.appendChild(line)
            }
            svg.classList.add("uc-guides", "uc-guides--semi-hidden")
            return svg
        }
        Bk() {
            const svg = this.Da
            if (!svg) {
                return
            }
            const fr = document.createDocumentFragment()
            const frameGuides = this.Ak()
            fr.appendChild(frameGuides)
            const frameThumbs = this.zk()
            for (const { groupNode } of Object.values(frameThumbs)) {
                fr.appendChild(groupNode)
            }
            svg.appendChild(fr)
            this.ua = frameThumbs
            this.Ob = frameGuides
            this.ze()
        }
        yk(direction, e11) {
            if (!this.ua) return
            const thumb = this.ua[direction]
            if (!thumb) {
                return
            }
            if (this.Ae(direction)) {
                return
            }
            const cropBox = this.$["*cropBox"]
            const svgElement = this.Da
            if (!svgElement) {
                return
            }
            const { x: svgX, y: svgY } = svgElement.getBoundingClientRect()
            const x2 = e11.x - svgX
            const y4 = e11.y - svgY
            this.Tb = true
            this.ye = thumb
            this.Pc = [x2, y4]
            this.bh = { ...cropBox }
        }
        Ck(direction, delta) {
            const [dx, dy] = delta
            const imageBox = this.$["*imageBox"]
            let rect = this.bh ?? this.$["*cropBox"]
            const cropPreset = this.$["*currentAspectRatio"]
            const aspectRatio = cropPreset
                ? cropPreset.width / cropPreset.height
                : void 0
            if (direction === "") {
                rect = moveRect({ rect, delta: [dx, dy], imageBox })
            } else {
                rect = resizeRect({
                    rect,
                    delta: [dx, dy],
                    direction,
                    aspectRatio,
                    imageBox,
                })
            }
            if (
                !Object.values(rect).every(
                    (number) => Number.isFinite(number) && number >= 0
                )
            ) {
                console.error(
                    "CropFrame is trying to create invalid rectangle",
                    {
                        payload: rect,
                    }
                )
                return
            }
            return constraintRect(roundRect(rect), imageBox)
        }
        fh() {
            const hoverThumb = this.ah
            const svg = this.Da
            if (!svg) {
                return
            }
            svg.style.cursor = hoverThumb
                ? thumbCursor(hoverThumb.direction)
                : "initial"
        }
        ih(href) {
            if (this.Pb) {
                this.Pb.setAttribute("href", href)
                return
            }
            const svg = this.Da
            if (!svg) {
                this.Sb = href
                return
            }
            this.Sb = null
            const fr = document.createDocumentFragment()
            const imageNode = createSvgNode("image", {
                href,
            })
            imageNode.setAttribute("class", "uc-cloud-mask")
            fr.appendChild(imageNode)
            svg.appendChild(fr)
            this.Pb = imageNode
        }
        Dk() {
            const cropBox = this.$["*cropBox"]
            if (!cropBox || !this.Pb) {
                return
            }
            const { x: x2, y: y4, width, height } = cropBox
            setSvgNodeAttrs(this.Pb, {
                x: x2,
                y: y4,
                height,
                width,
            })
        }
        Be() {
            if (!this.Rb) {
                return
            }
            this.wk()
            this.xk()
            this.Dk()
        }
        toggleThumbs(visible) {
            if (!this.ua) return
            for (const thumb of Object.values(this.ua)) {
                if (!thumb) {
                    continue
                }
                const { groupNode } = thumb
                groupNode.setAttribute(
                    "class",
                    classNames("uc-thumb", {
                        "uc-thumb--hidden": !visible,
                        "uc-thumb--visible": visible,
                    })
                )
            }
        }
        initCallback() {
            super.initCallback()
            this.sub("*imageBox", () => {
                this.vk()
                if (!this.Rb) {
                    return
                }
                window.requestAnimationFrame(() => {
                    this.Be()
                })
            })
            this.sub("*cropBox", (cropBox) => {
                if (!cropBox) {
                    return
                }
                this.Qc =
                    cropBox.height <= MIN_CROP_SIZE ||
                    cropBox.width <= MIN_CROP_SIZE
                this.ze()
                if (!this.Rb) {
                    return
                }
                window.requestAnimationFrame(() => {
                    this.Be()
                })
            })
            this.subConfigValue("cloudImageEditorMaskHref", (maskHref) => {
                if (maskHref) {
                    this.ih(maskHref)
                }
            })
            document.addEventListener("pointermove", this.gh, true)
            document.addEventListener("pointerup", this.eh, true)
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this.Ek()
        }
        Ek() {
            const svg = this.Da
            if (!svg || this.Rb) {
                return
            }
            this.uk()
            this.Bk()
            this.Rb = true
            svg.addEventListener("pointermove", this.hh, true)
            if (this.Sb) {
                const pendingMask = this.Sb
                this.Sb = null
                this.ih(pendingMask)
            }
            this.Be()
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            const svg = this.Da
            svg?.removeEventListener("pointermove", this.hh, true)
            document.removeEventListener("pointermove", this.gh, true)
            document.removeEventListener("pointerup", this.eh, true)
        }
        render() {
            return b2`<svg class="uc-svg" xmlns="http://www.w3.org/2000/svg" ${n7(this.ch)}></svg>`
        }
    }
    __decorateClass([r5()], CropFrame.prototype, /* @__KEY__ */ "Qb", 2)

    // src/blocks/CloudImageEditor/src/EditorImageCropper.ts
    function validateCrop(crop) {
        if (!crop) {
            return true
        }
        const shouldMatch = [
            ({ dimensions, coords }) =>
                [...dimensions, ...coords].every(
                    (number) =>
                        Number.isInteger(number) && Number.isFinite(number)
                ),
            ({ dimensions, coords }) =>
                dimensions.every((d7) => d7 > 0) &&
                coords.every((c11) => c11 >= 0),
        ]
        return shouldMatch.every((matcher) => matcher(crop))
    }
    var EditorImageCropper = class extends LitBlock {
        constructor() {
            super()
            this.ctxOwner = true
            this.Ua = { width: 0, height: 0 }
            this.b = null
            this.E = false
            this.ga = null
            this.kh = e9()
            this.Ee = e9()
            this.init$ = {
                ...this.init$,
                "*padding": CROP_PADDING,
                "*operations": {
                    rotate: 0,
                    mirror: false,
                    flip: false,
                },
                "*imageBox": {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                },
                "*cropBox": {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                },
            }
            this.jh = debounce(this.lh.bind(this), 300)
            this.Ce = throttle(() => {
                if (!this.isConnected || !this.E) {
                    return
                }
                this.Fe()
                this.mh()
                this.nh()
                this.Ge()
                this.He()
            }, 100)
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this.Fe()
        }
        mh() {
            const transformations = this.$["*editorTransformations"]
            const pickedTransformations = pick(
                transformations,
                Object.keys(this.$["*operations"])
            )
            const operations = {
                ...this.$["*operations"],
                ...pickedTransformations,
            }
            this.$["*operations"] = operations
        }
        Fe() {
            const canvas = this.kh.value
            if (!canvas) {
                return
            }
            const ctx = canvas.getContext("2d")
            const width = this.offsetWidth
            const height = this.offsetHeight
            const dpr = window.devicePixelRatio
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx?.scale(dpr, dpr)
            this.De = canvas
            this.b = ctx
        }
        nh() {
            if (!this.E || !this.ga) {
                return
            }
            const image = this.ga
            const padding = this.$["*padding"]
            const operations = this.$["*operations"]
            const { rotate } = operations
            const bounds = {
                width: this.offsetWidth,
                height: this.offsetHeight,
            }
            const naturalSize = rotateSize(
                { width: image.naturalWidth, height: image.naturalHeight },
                rotate
            )
            let imageBox
            if (
                naturalSize.width > bounds.width - padding * 2 ||
                naturalSize.height > bounds.height - padding * 2
            ) {
                const imageAspectRatio = naturalSize.width / naturalSize.height
                const viewportAspectRatio = bounds.width / bounds.height
                if (imageAspectRatio > viewportAspectRatio) {
                    const width = bounds.width - padding * 2
                    const height = width / imageAspectRatio
                    const x2 = 0 + padding
                    const y4 =
                        padding + (bounds.height - padding * 2) / 2 - height / 2
                    imageBox = { x: x2, y: y4, width, height }
                } else {
                    const height = bounds.height - padding * 2
                    const width = height * imageAspectRatio
                    const x2 =
                        padding + (bounds.width - padding * 2) / 2 - width / 2
                    const y4 = 0 + padding
                    imageBox = { x: x2, y: y4, width, height }
                }
            } else {
                const { width, height } = naturalSize
                const x2 =
                    padding + (bounds.width - padding * 2) / 2 - width / 2
                const y4 =
                    padding + (bounds.height - padding * 2) / 2 - height / 2
                imageBox = { x: x2, y: y4, width, height }
            }
            this.$["*imageBox"] = roundRect(imageBox)
        }
        Ge() {
            let cropBox = this.$["*cropBox"]
            const imageBox = this.$["*imageBox"]
            const operations = this.$["*operations"]
            const { rotate } = operations
            const cropTransformation = this.$["*editorTransformations"].crop
            const { width: previewWidth, x: previewX, y: previewY } = imageBox
            if (cropTransformation) {
                const {
                    dimensions: [width, height],
                    coords: [x2, y4],
                } = cropTransformation
                const { width: sourceWidth } = rotateSize(this.Ua, rotate)
                const ratio = previewWidth / sourceWidth
                cropBox = constraintRect(
                    roundRect({
                        x: previewX + x2 * ratio,
                        y: previewY + y4 * ratio,
                        width: width * ratio,
                        height: height * ratio,
                    }),
                    imageBox
                )
            }
            const cropPreset = this.$["*currentAspectRatio"]
            const cropAspectRatio = cropPreset
                ? cropPreset.width / cropPreset.height
                : void 0
            if (
                !isRectInsideRect(cropBox, imageBox) ||
                (cropAspectRatio &&
                    !isRectMatchesAspectRatio(cropBox, cropAspectRatio))
            ) {
                const imageAspectRatio = imageBox.width / imageBox.height
                let width = imageBox.width
                let height = imageBox.height
                if (cropAspectRatio) {
                    if (imageAspectRatio > cropAspectRatio) {
                        width = Math.min(
                            imageBox.height * cropAspectRatio,
                            imageBox.width
                        )
                    } else {
                        height = Math.min(
                            imageBox.width / cropAspectRatio,
                            imageBox.height
                        )
                    }
                }
                cropBox = {
                    x: imageBox.x + imageBox.width / 2 - width / 2,
                    y: imageBox.y + imageBox.height / 2 - height / 2,
                    width,
                    height,
                }
            }
            this.$["*cropBox"] = constraintRect(roundRect(cropBox), imageBox)
        }
        Fk() {
            const ctx = this.b
            if (!ctx) return
            const image = this.ga
            if (!image) {
                return
            }
            const imageBox = this.$["*imageBox"]
            const operations = this.$["*operations"]
            const { mirror, flip, rotate } = operations
            const rotated = rotateSize(
                { width: imageBox.width, height: imageBox.height },
                rotate
            )
            ctx.save()
            ctx.translate(
                imageBox.x + imageBox.width / 2,
                imageBox.y + imageBox.height / 2
            )
            ctx.rotate((rotate * Math.PI * -1) / 180)
            ctx.scale(mirror ? -1 : 1, flip ? -1 : 1)
            ctx.drawImage(
                image,
                -rotated.width / 2,
                -rotated.height / 2,
                rotated.width,
                rotated.height
            )
            ctx.restore()
        }
        He() {
            if (!this.E || !this.ga || !this.De || !this.b) {
                return
            }
            const canvas = this.De
            const ctx = this.b
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            this.Fk()
        }
        Gk({ fromViewer }) {
            if (this.ga) {
                this.Ee.value?.toggleThumbs(true)
                this.Hk()
                setTimeout(() => {
                    this.className = classNames({
                        "uc-active_from_viewer": fromViewer,
                        "uc-active_from_editor": !fromViewer,
                        "uc-inactive_to_editor": false,
                    })
                })
            }
        }
        oh() {
            const cropBox = this.$["*cropBox"]
            const imageBox = this.$["*imageBox"]
            const operations = this.$["*operations"]
            const { rotate } = operations
            const { width: previewWidth, height: previewHeight } = imageBox
            const { width: sourceWidth, height: sourceHeight } = rotateSize(
                this.Ua,
                rotate
            )
            const { width: cropWidth, height: cropHeight } = cropBox
            const ratioW = previewWidth / sourceWidth
            const ratioH = previewHeight / sourceHeight
            const dimensions = [
                clamp(Math.round(cropWidth / ratioW), 1, sourceWidth),
                clamp(Math.round(cropHeight / ratioH), 1, sourceHeight),
            ]
            return dimensions
        }
        Ik() {
            const cropBox = this.$["*cropBox"]
            const imageBox = this.$["*imageBox"]
            const operations = this.$["*operations"]
            const { rotate } = operations
            const {
                width: previewWidth,
                height: previewHeight,
                x: previewX,
                y: previewY,
            } = imageBox
            const { width: sourceWidth, height: sourceHeight } = rotateSize(
                this.Ua,
                rotate
            )
            const { x: cropX, y: cropY } = cropBox
            const ratioW = previewWidth / sourceWidth
            const ratioH = previewHeight / sourceHeight
            const dimensions = this.oh()
            const crop = {
                dimensions,
                coords: [
                    clamp(
                        Math.round((cropX - previewX) / ratioW),
                        0,
                        sourceWidth - dimensions[0]
                    ),
                    clamp(
                        Math.round((cropY - previewY) / ratioH),
                        0,
                        sourceHeight - dimensions[1]
                    ),
                ],
            }
            if (!validateCrop(crop)) {
                console.error(
                    "Cropper is trying to create invalid crop object",
                    {
                        payload: crop,
                    }
                )
                return void 0
            }
            if (
                dimensions[0] === sourceWidth &&
                dimensions[1] === sourceHeight
            ) {
                return void 0
            }
            return crop
        }
        lh() {
            if (!this.isConnected || !this.Ua) {
                return
            }
            const operations = this.$["*operations"]
            const { rotate, mirror, flip } = operations
            const crop = this.Ik()
            const editorTransformations = this.$["*editorTransformations"]
            const transformations = {
                ...editorTransformations,
                crop,
                rotate,
                mirror,
                flip,
            }
            this.$["*editorTransformations"] = transformations
        }
        setValue(operation, value) {
            this.$["*operations"] = {
                ...this.$["*operations"],
                [operation]: value,
            }
            if (!this.E) {
                return
            }
            this.nh()
            this.Ge()
            this.He()
        }
        getValue(operation) {
            return this.$["*operations"][operation]
        }
        async activate(imageSize, { fromViewer } = {}) {
            if (this.E) {
                return
            }
            this.E = true
            await this.updateComplete
            this.Fe()
            this.Ua = imageSize
            this.removeEventListener("transitionend", this.ph)
            try {
                const originalUrl = this.$["*originalUrl"]
                const transformations = this.$["*editorTransformations"]
                this.ga = await this.Jk(originalUrl, transformations)
                this.mh()
                this.Ce()
                this.Gk({ fromViewer })
            } catch (err) {
                console.error("Failed to activate cropper", { error: err })
                this.telemetryManager.sendEventError(
                    err,
                    "cloud editor image. Failed to activate cropper"
                )
            }
            this.e = new ResizeObserver((entries) => {
                const [entry] = entries
                if (!entry) {
                    return
                }
                const nonZeroSize =
                    entry.contentRect.width > 0 && entry.contentRect.height > 0
                if (nonZeroSize && this.E && this.ga) {
                    this.Ce()
                }
            })
            this.e.observe(this)
        }
        deactivate({ reset = false } = {}) {
            if (!this.E) {
                return
            }
            !reset && this.lh()
            this.E = false
            this.Kk()
            this.className = classNames({
                "uc-active_from_viewer": false,
                "uc-active_from_editor": false,
                "uc-inactive_to_editor": true,
            })
            this.Ee.value?.toggleThumbs(false)
            this.addEventListener("transitionend", this.ph, { once: true })
            this.e?.disconnect()
        }
        Kk() {
            const dimensions = this.oh()
            const cropBox = this.$["*cropBox"]
            const scaleX =
                Math.min(this.offsetWidth, dimensions[0]) / cropBox.width
            const scaleY =
                Math.min(this.offsetHeight, dimensions[1]) / cropBox.height
            const scale = Math.min(scaleX, scaleY)
            const cropCenterX = cropBox.x + cropBox.width / 2
            const cropCenterY = cropBox.y + cropBox.height / 2
            this.style.transform = `scale(${scale}) translate(${(this.offsetWidth / 2 - cropCenterX) / scale}px, ${(this.offsetHeight / 2 - cropCenterY) / scale}px)`
            this.style.transformOrigin = `${cropCenterX}px ${cropCenterY}px`
        }
        Hk() {
            const cropBox = this.$["*cropBox"]
            const cropCenterX = cropBox.x + cropBox.width / 2
            const cropCenterY = cropBox.y + cropBox.height / 2
            this.style.transform = `scale(1)`
            this.style.transformOrigin = `${cropCenterX}px ${cropCenterY}px`
        }
        ph() {
            if (!this.E) {
                this.ga = null
            }
        }
        async Jk(originalUrl, transformations) {
            const width = this.offsetWidth
            transformations = {
                ...transformations,
                crop: void 0,
                rotate: void 0,
                flip: void 0,
                mirror: void 0,
            }
            const src = await this.proxyUrl(
                viewerImageSrc(originalUrl, width, transformations)
            )
            const { promise, cancel, image } = preloadImage(src)
            const stop = this.qb(src)
            image.addEventListener("load", stop, { once: true })
            image.addEventListener("error", stop, { once: true })
            this.s?.()
            this.s = cancel
            return promise
                .then(() => image)
                .catch((err) => {
                    console.error("Failed to load image", { error: err })
                    this.$["*networkProblems"] = true
                    return image
                })
        }
        qb(src) {
            const operation = "crop"
            const loadingOperations = this.$["*loadingOperations"]
            let operationMap = loadingOperations.get(operation)
            if (!operationMap) {
                operationMap = /* @__PURE__ */ new Map()
                loadingOperations.set(operation, operationMap)
            }
            if (!operationMap.get(src)) {
                operationMap.set(src, true)
                this.$["*loadingOperations"] = loadingOperations
            }
            return () => {
                const map2 = loadingOperations.get(operation)
                if (map2?.has(src)) {
                    map2.delete(src)
                    this.$["*loadingOperations"] = loadingOperations
                }
            }
        }
        initCallback() {
            super.initCallback()
            this.sub("*imageBox", () => {
                this.He()
            })
            this.sub("*cropBox", () => {
                if (this.ga) {
                    this.jh()
                }
            })
            this.sub("*currentAspectRatio", () => {
                this.Ge()
            })
            setTimeout(() => {
                this.sub("*networkProblems", (networkProblems) => {
                    if (!networkProblems) {
                        if (this.E && this.Ua) {
                            void this.activate(this.Ua, { fromViewer: false })
                        }
                    }
                })
            }, 0)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.e?.disconnect()
            if (this.ga) {
                this.ga = null
            }
        }
        render() {
            return b2`
      <canvas class="uc-canvas" ${n7(this.kh)}></canvas>
      <uc-crop-frame ${n7(this.Ee)}></uc-crop-frame>
    `
        }
    }
    __decorateClass(
        [r5()],
        EditorImageCropper.prototype,
        /* @__KEY__ */ "ga",
        2
    )

    // src/blocks/CloudImageEditor/src/lib/linspace.ts
    function linspace(a6, b3, n10) {
        const length = n10
        const lastIndex = n10 - 1
        const ret = new Array(length)
        for (let i12 = lastIndex; i12 >= 0; i12 -= 1) {
            ret[i12] = Math.ceil(
                (i12 * b3 + (lastIndex - i12) * a6) / lastIndex
            )
        }
        return ret
    }

    // src/blocks/CloudImageEditor/src/EditorImageFader.ts
    function isOperationKey(value) {
        return typeof value === "string" && value in COLOR_OPERATIONS_CONFIG
    }
    function splitBySections(numbers) {
        const sections = []
        for (let idx = 0; idx < numbers.length - 1; idx += 1) {
            const current = numbers[idx]
            const next = numbers[idx + 1]
            if (typeof current === "number" && typeof next === "number") {
                sections.push([current, next])
            }
        }
        return sections
    }
    function calculateOpacities(keypoints, value, zero) {
        const section = splitBySections(keypoints).find(
            ([left2, right2]) => left2 <= value && value <= right2
        )
        if (!section) {
            return keypoints.map(() => 0)
        }
        const [left, right] = section
        return keypoints.map((point) => {
            const distance2 = Math.abs(left - right) || 1
            const relation = Math.abs(value - left) / distance2
            if (left === point) {
                return value > zero ? 1 : 1 - relation
            }
            if (right === point) {
                return value >= zero ? relation : 1
            }
            return 0
        })
    }
    function calculateZIndices(keypoints, zero) {
        return keypoints.map((point, idx) =>
            point < zero ? keypoints.length - idx : idx
        )
    }
    function keypointsRange(operation, value) {
        const n10 = COLOR_OPERATIONS_CONFIG[operation].keypointsNumber
        const { range, zero } = COLOR_OPERATIONS_CONFIG[operation]
        return [
            .../* @__PURE__ */ new Set([
                ...linspace(range[0], zero, n10 + 1),
                ...linspace(zero, range[1], n10 + 1),
                zero,
                value,
            ]),
        ].sort((a6, b3) => a6 - b3)
    }
    var EditorImageFader = class extends LitBlock {
        constructor() {
            super()
            this.E = false
            this.Ie = true
            this.f = "initial"
            this.qh = {}
            this.Ea = []
            this.sh = 0
            this.uh = e9()
            this.Rc = e9()
            this.classList.add("uc-inactive_to_cropper")
            this.th = debounce(async (operation, filter, value) => {
                const shouldSkip = () =>
                    !this.vh(operation, filter) ||
                    this.kb !== value ||
                    !!this.Ea.find((kp) => kp.value === value)
                if (shouldSkip()) {
                    return
                }
                const keypoint = await this.wh(operation, value)
                const image = new Image()
                image.src = keypoint.src
                const stop = this.qb(keypoint.src)
                image.addEventListener("load", stop, { once: true })
                image.addEventListener("error", stop, { once: true })
                keypoint.image = image
                image.classList.add("uc-fader-image")
                image.addEventListener(
                    "load",
                    () => {
                        if (shouldSkip()) {
                            return
                        }
                        const keypoints = this.Ea
                        let insertIndex = keypoints.findIndex(
                            (kp) => kp.value > value
                        )
                        if (insertIndex === -1) {
                            insertIndex = keypoints.length
                        }
                        const nextKeypoint = keypoints[insertIndex]
                        const insertBeforeNode = nextKeypoint?.image
                        const container = this.Rc.value
                        if (
                            !container ||
                            (insertBeforeNode &&
                                !container.contains(insertBeforeNode))
                        ) {
                            return
                        }
                        keypoints.splice(insertIndex, 0, keypoint)
                        if (insertBeforeNode) {
                            container.insertBefore(image, insertBeforeNode)
                        } else {
                            container.appendChild(image)
                        }
                        this.Le(operation, value)
                    },
                    { once: true }
                )
                image.addEventListener(
                    "error",
                    () => {
                        this.$["*networkProblems"] = true
                    },
                    { once: true }
                )
            }, 600)
        }
        qb(src) {
            const operation = this.f
            const loadingOperations = this.$["*loadingOperations"]
            if (!loadingOperations.has(operation)) {
                loadingOperations.set(operation, /* @__PURE__ */ new Map())
            }
            const operationMap = loadingOperations.get(operation)
            if (operationMap && !operationMap.get(src)) {
                operationMap.set(src, true)
                this.$["*loadingOperations"] = loadingOperations
            }
            return () => {
                const currentOperationMap = loadingOperations.get(operation)
                if (currentOperationMap?.has(src)) {
                    currentOperationMap.delete(src)
                    this.$["*loadingOperations"] = loadingOperations
                }
            }
        }
        xh() {
            window.cancelAnimationFrame(this.sh)
            this.sh = window.requestAnimationFrame(() => {
                for (const kp of this.Ea) {
                    const { image } = kp
                    if (image) {
                        image.style.opacity = kp.opacity.toString()
                        image.style.zIndex = kp.zIndex.toString()
                    }
                }
            })
        }
        Va({
            url = this.rh,
            filter = this.q ?? void 0,
            operation,
            value,
        } = {}) {
            if (!url) {
                throw new Error("URL is not defined")
            }
            const transformations = { ...this.qh }
            if (operation) {
                if (operation === "filter") {
                    if (filter && typeof value === "number") {
                        transformations.filter = { name: filter, amount: value }
                    }
                } else if (typeof value === "number") {
                    transformations[operation] = value
                }
            }
            const width = this.offsetWidth
            return this.proxyUrl(viewerImageSrc(url, width, transformations))
        }
        async wh(operation, value) {
            const src = await this.Va({ operation, value })
            return {
                src,
                image: void 0,
                opacity: 0,
                zIndex: 0,
                value,
            }
        }
        /**
         * Check if current operation and filter equals passed ones
         */
        vh(operation, filter) {
            return this.f === operation && this.q === filter
        }
        set(value) {
            const numericValue =
                typeof value === "string" ? parseInt(value, 10) : value
            if (!isOperationKey(this.f) || !Number.isFinite(numericValue)) {
                return
            }
            this.Le(this.f, numericValue)
            this.th(this.f, this.q, numericValue)
        }
        Le(operation, value) {
            this.f = operation
            this.kb = value
            const { zero } = COLOR_OPERATIONS_CONFIG[operation]
            const keypointValues = this.Ea.map((kp) => kp.value)
            const opacities = calculateOpacities(keypointValues, value, zero)
            const zIndices = calculateZIndices(keypointValues, zero)
            this.Ea.forEach((kp, idx) => {
                const opacity = opacities[idx]
                const zIndex = zIndices[idx]
                if (typeof opacity === "number") {
                    kp.opacity = opacity
                }
                if (typeof zIndex === "number") {
                    kp.zIndex = zIndex
                }
            })
            this.xh()
        }
        yh() {
            const image = new Image()
            image.classList.add("uc-fader-image", "uc-fader-image--preview")
            image.style.opacity = "0"
            return image
        }
        async Lk() {
            this.g = this.g || this.yh()
            const previewImage = this.g
            if (previewImage) {
                this.zh(previewImage)
            }
            const srcList = this.Ea.map((kp) => kp.src)
            const { images, promise, cancel } = batchPreloadImages(srcList)
            images.forEach((node) => {
                const stop = this.qb(node.src)
                node.addEventListener("load", stop)
                node.addEventListener("error", stop)
            })
            this.Je = () => {
                cancel()
                this.Je = void 0
            }
            const operation = this.f
            const filter = this.q
            await promise
            if (this.E && this.vh(operation, filter)) {
                const host = this.Rc.value
                if (!host) {
                    return
                }
                host.replaceChildren()
                this.Ea.forEach((kp, idx) => {
                    const kpImage = images[idx]
                    if (!kpImage) {
                        return
                    }
                    kpImage.classList.add("uc-fader-image")
                    kp.image = kpImage
                    host.appendChild(kpImage)
                })
                this.xh()
            }
        }
        async setTransformations(transformations) {
            this.qh = transformations
            if (this.g) {
                const src = await this.Va()
                const stop = this.qb(src)
                this.g.src = src
                this.g.addEventListener("load", stop, { once: true })
                this.g.addEventListener("error", stop, { once: true })
                this.g.style.opacity = "1"
                this.g.addEventListener(
                    "error",
                    () => {
                        this.$["*networkProblems"] = true
                    },
                    { once: true }
                )
            }
        }
        async preload({ url, filter, operation, value }) {
            if (!operation || typeof value !== "number") {
                return
            }
            this.Ke?.()
            const keypoints = keypointsRange(operation, value)
            const srcList = await Promise.all(
                keypoints.map((kp) =>
                    this.Va({ url, filter, operation, value: kp })
                )
            )
            const { cancel } = batchPreloadImages(srcList)
            this.Ke = cancel
        }
        Mk(src) {
            const image = this.g || this.yh()
            this.zh(image)
            this.g = image
            if (image.src === src) {
                image.style.opacity = "1"
                image.style.transform = "scale(1)"
                this.className = classNames({
                    "uc-active_from_viewer": this.Ub,
                    "uc-active_from_cropper": !this.Ub,
                    "uc-inactive_to_cropper": false,
                })
                return
            }
            image.style.opacity = "0"
            const stop = this.qb(src)
            image.addEventListener("error", stop, { once: true })
            image.src = src
            image.addEventListener(
                "load",
                () => {
                    stop()
                    if (image) {
                        image.style.opacity = "1"
                        image.style.transform = "scale(1)"
                        this.className = classNames({
                            "uc-active_from_viewer": this.Ub,
                            "uc-active_from_cropper": !this.Ub,
                            "uc-inactive_to_cropper": false,
                        })
                    }
                },
                { once: true }
            )
            image.addEventListener(
                "error",
                () => {
                    this.$["*networkProblems"] = true
                },
                { once: true }
            )
        }
        async activate({ url, operation, value, filter, fromViewer }) {
            this.E = true
            this.Ie = false
            await this.updateComplete
            this.rh = url
            this.f = operation ?? "initial"
            this.kb = value
            this.q = filter
            this.Ub = fromViewer
            const isOriginal = typeof value !== "number" && !filter
            if (isOriginal) {
                const src = await this.Va({ operation, value })
                this.Mk(src)
                this.Me()
                return
            }
            if (!operation || typeof value !== "number") {
                return
            }
            this.Ea = await Promise.all(
                keypointsRange(operation, value).map((keyValue) =>
                    this.wh(operation, keyValue)
                )
            )
            this.Le(operation, value)
            this.Lk()
        }
        deactivate({ hide = true } = {}) {
            this.E = false
            this.Je?.()
            this.Ke?.()
            if (hide && !this.Ie) {
                this.Ie = true
                if (this.g) {
                    this.g.style.transform = "scale(1)"
                }
                this.className = classNames({
                    "uc-active_from_viewer": false,
                    "uc-active_from_cropper": false,
                    "uc-inactive_to_cropper": true,
                })
                this.addEventListener(
                    "transitionend",
                    () => {
                        this.Me()
                    },
                    { once: true }
                )
            } else {
                this.Me()
            }
        }
        zh(image) {
            const host = this.uh.value
            if (!host) {
                return
            }
            if (!host.contains(image)) {
                host.appendChild(image)
            }
        }
        Me() {
            this.Rc.value?.replaceChildren()
        }
        render() {
            return b2`
      <div class="uc-fader-preview-host" ${n7(this.uh)}></div>
      <div class="uc-fader-layers-host" ${n7(this.Rc)}></div>
    `
        }
    }

    // src/blocks/CloudImageEditor/src/elements/slider/SliderUi.ts
    var SliderUi = class extends LitBlock {
        constructor() {
            super()
            this.Ne = 0
            this.Sc = e9()
            this.Bh = e9()
            this.Ch = e9()
            this.disabled = false
            this.min = 0
            this.max = 100
            this.defaultValue = 0
            this.zero = 0
            this.Fa = 0
            this.Ok = (event) => {
                event.stopPropagation()
                const value = this.Dh(event)
                if (value === null) {
                    return
                }
                this.Oe(value)
                this.Nk("slider-input", value)
            }
            this.Pk = (event) => {
                event.stopPropagation()
                const value = this.Dh(event)
                if (value === null) {
                    return
                }
                this.Oe(value)
            }
            this.Eh = () => {
                this.style.setProperty(
                    "--color-effect",
                    "var(--hover-color-rgb)"
                )
            }
            this.Fh = () => {
                this.style.setProperty(
                    "--color-effect",
                    "var(--idle-color-rgb)"
                )
            }
            this.setAttribute("with-effects", "")
        }
        Nk(type, value) {
            this.dispatchEvent(
                new CustomEvent(type, {
                    detail: { value },
                    bubbles: true,
                    composed: true,
                })
            )
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this.Ne =
                Number.parseInt(
                    window
                        .getComputedStyle(this)
                        .getPropertyValue("--l-thumb-size"),
                    10
                ) || 0
            this.Gh(this.Fa)
            this.Pe()
            this.e = new ResizeObserver(() => {
                this.Pe()
                this.Tc(this.Fa)
            })
            this.e.observe(this)
            const inputEl = this.Sc.value
            inputEl?.addEventListener("focus", this.Eh)
            inputEl?.addEventListener("blur", this.Fh)
            window.setTimeout(() => {
                this.Tc(this.Fa)
            }, 0)
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (
                changedProperties.has("defaultValue") &&
                this.defaultValue !== this.Fa
            ) {
                this.Oe(this.defaultValue)
            }
            const boundsChanged =
                changedProperties.has("min") || changedProperties.has("max")
            if (boundsChanged && this.hasUpdated) {
                this.Pe()
                this.Tc(this.Fa)
            }
            if (changedProperties.has("zero") && this.hasUpdated) {
                this.Hh(this.Fa)
            }
        }
        Tc(value) {
            this.Hh(value)
            const range = this.max - this.min
            if (range === 0) {
                return
            }
            const { width } = this.getBoundingClientRect()
            const slope = 100 / range
            const mappedValue = slope * (value - this.min)
            const offset = (mappedValue * (width - this.Ne)) / 100
            window.requestAnimationFrame(() => {
                const thumbEl = this.Bh.value
                if (thumbEl) {
                    thumbEl.style.transform = `translateX(${offset}px)`
                }
            })
        }
        Hh(value) {
            if (!this.Vb) {
                return
            }
            const range = this.max - this.min
            if (range === 0) {
                return
            }
            this.Vb.style.opacity = value === this.zero ? "0" : "1"
            const { width } = this.getBoundingClientRect()
            const slope = 100 / range
            const mappedValue = slope * (this.zero - this.min)
            const offset = (mappedValue * (width - this.Ne)) / 100
            window.requestAnimationFrame(() => {
                if (this.Vb) {
                    this.Vb.style.transform = `translateX(${offset}px)`
                }
            })
        }
        Pe() {
            const STEP_GAP = 15
            const stepsEl = this.Ch.value
            if (!stepsEl) {
                return
            }
            const { width } = stepsEl.getBoundingClientRect()
            const half = Math.ceil(width / 2)
            const count = Math.ceil(half / STEP_GAP) - 2
            if (this.Ah === count) {
                return
            }
            const fragment = document.createDocumentFragment()
            const minorStepEl = document.createElement("div")
            const borderStepEl = document.createElement("div")
            minorStepEl.className = "uc-minor-step"
            borderStepEl.className = "uc-border-step"
            fragment.appendChild(borderStepEl)
            for (let i12 = 0; i12 < count; i12 += 1) {
                fragment.appendChild(minorStepEl.cloneNode())
            }
            fragment.appendChild(borderStepEl.cloneNode())
            for (let i12 = 0; i12 < count; i12 += 1) {
                fragment.appendChild(minorStepEl.cloneNode())
            }
            fragment.appendChild(borderStepEl.cloneNode())
            const zeroDotEl = document.createElement("div")
            zeroDotEl.className = "uc-zero-dot"
            fragment.appendChild(zeroDotEl)
            this.Vb = zeroDotEl
            stepsEl.innerHTML = ""
            stepsEl.appendChild(fragment)
            this.Ah = count
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            const inputEl = this.Sc.value
            inputEl?.removeEventListener("focus", this.Eh)
            inputEl?.removeEventListener("blur", this.Fh)
            this.e?.disconnect()
            this.e = void 0
        }
        Oe(value) {
            if (!Number.isFinite(value)) {
                return
            }
            this.Fa = value
            if (this.hasUpdated) {
                this.Gh(value)
                this.Tc(value)
            }
        }
        Gh(value) {
            const inputEl = this.Sc.value
            if (inputEl) {
                inputEl.value = String(value)
            }
        }
        Dh(event) {
            const target = event.currentTarget
            if (!target) {
                return null
            }
            const parsedValue = Number.parseInt(target.value, 10)
            return Number.isFinite(parsedValue) ? parsedValue : null
        }
        render() {
            return b2`
      <div class="uc-steps" ${n7(this.Ch)}></div>
      <div class="uc-thumb" ${n7(this.Bh)}></div>
      <input
        class="uc-input"
        type="range"
        ${n7(this.Sc)}
        .min=${String(this.min)}
        .max=${String(this.max)}
        .value=${String(this.Fa)}
        ?disabled=${this.disabled}
        @input=${this.Ok}
        @change=${this.Pk}
      />
    `
        }
    }
    __decorateClass(
        [n5({ type: Boolean, reflect: true })],
        SliderUi.prototype,
        "disabled",
        2
    )
    __decorateClass([n5({ type: Number })], SliderUi.prototype, "min", 2)
    __decorateClass([n5({ type: Number })], SliderUi.prototype, "max", 2)
    __decorateClass(
        [n5({ type: Number, attribute: false })],
        SliderUi.prototype,
        "defaultValue",
        2
    )
    __decorateClass([n5({ type: Number })], SliderUi.prototype, "zero", 2)
    __decorateClass([r5()], SliderUi.prototype, /* @__KEY__ */ "Fa", 2)

    // src/blocks/CloudImageEditor/src/EditorSlider.ts
    var FAKE_ORIGINAL_FILTER = "original"
    var EditorSlider = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.state = {
                operation: "filter",
                filter: void 0,
                originalUrl: "",
                disabled: false,
                min: 0,
                max: 100,
                value: 0,
                defaultValue: 0,
                zero: 0,
            }
            this.Qk = (e11) => {
                const { value } = e11.detail
                const fader = this.$["*faderEl"]
                fader?.set(value)
                this.state = { ...this.state, value }
            }
        }
        setOperation(operation, filter) {
            this.state = { ...this.state, operation, filter }
            this.Rk()
            const fader = this.$["*faderEl"]
            const originalUrl = this.state.originalUrl || this.$["*originalUrl"]
            if (fader && originalUrl) {
                fader.activate({
                    url: originalUrl,
                    operation: this.state.operation,
                    value:
                        this.state.filter === FAKE_ORIGINAL_FILTER
                            ? void 0
                            : this.state.value,
                    filter:
                        this.state.filter === FAKE_ORIGINAL_FILTER
                            ? void 0
                            : this.state.filter,
                    fromViewer: false,
                })
            }
        }
        Rk() {
            const operation = this.state.operation
            const { range, zero } = COLOR_OPERATIONS_CONFIG[operation]
            const [min, max] = range
            this.state = { ...this.state, min, max, zero }
            const editorTransformations = this.$["*editorTransformations"]
            const transformation = editorTransformations[operation]
            if (operation === "filter") {
                let value2 = Number(max)
                const filterTransformation = transformation
                if (filterTransformation) {
                    const { name, amount } = filterTransformation
                    value2 = name === this.state.filter ? amount : max
                }
                this.state = {
                    ...this.state,
                    value: value2,
                    defaultValue: value2,
                }
                return
            }
            const value =
                typeof transformation !== "undefined" ? transformation : zero
            this.state = { ...this.state, value, defaultValue: value }
        }
        apply() {
            const editorTransformations = this.$["*editorTransformations"]
            const transformations = { ...editorTransformations }
            if (this.state.operation === "filter") {
                if (
                    !this.state.filter ||
                    this.state.filter === FAKE_ORIGINAL_FILTER
                ) {
                    delete transformations.filter
                } else {
                    transformations.filter = {
                        name: this.state.filter,
                        amount: this.state.value,
                    }
                }
            } else {
                transformations[this.state.operation] = this.state.value
            }
            this.$["*editorTransformations"] = transformations
        }
        cancel() {
            const fader = this.$["*faderEl"]
            fader?.deactivate({ hide: false })
        }
        initCallback() {
            super.initCallback()
            this.sub("*originalUrl", (originalUrl) => {
                if (!originalUrl) {
                    return
                }
                this.state = { ...this.state, originalUrl }
            })
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("state")) {
                const tooltip = `${this.state.filter ?? this.state.operation} ${this.state.value}`
                this.$["*operationTooltip"] = tooltip
            }
        }
        render() {
            return b2`
      <uc-slider-ui
        .disabled=${this.state.disabled}
        .min=${this.state.min}
        .max=${this.state.max}
        .defaultValue=${this.state.defaultValue}
        .zero=${this.state.zero}
        @slider-input=${this.Qk}
      ></uc-slider-ui>
    `
        }
    }
    __decorateClass([r5()], EditorSlider.prototype, "state", 2)

    // src/blocks/CloudImageEditor/src/utils/parseFilterValue.ts
    function parseFilterValue(str) {
        if (!str) return null
        const match = str.match(/^([A-Za-z]+)\s+(\d+)$/)
        if (!match) return null
        const [, filter, amount] = match
        if (!filter || typeof amount === "undefined") {
            return null
        }
        return { filter, value: Number(amount) }
    }

    // src/blocks/CloudImageEditor/src/EditorButtonControl.ts
    var EditorButtonControl = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.active = false
            this.title = ""
            this.icon = ""
            this.titleProp = ""
        }
        get buttonClasses() {
            const isActive = this.active
            return {
                "uc-active": isActive,
                "uc-not_active": !isActive,
            }
        }
        Ih() {
            const classes = this.buttonClasses
            for (const [className, enabled] of Object.entries(classes)) {
                this.classList.toggle(className, enabled)
            }
        }
        onClick(_event) {}
        connectedCallback() {
            super.connectedCallback()
            this.Ih()
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("active")) {
                this.Ih()
            }
        }
        render() {
            const clickHandler = this.onClick
            const title = this.title
            return b2`
      <button
        role="option"
        type="button"
        aria-label=${o13(this.titleProp)}
        title=${o13(this.titleProp)}
        @click=${clickHandler}
      >
        <uc-icon name=${this.icon}></uc-icon>
        <div class="uc-title" ?hidden=${!title}>${title}</div>
      </button>
    `
        }
    }
    __decorateClass([r5()], EditorButtonControl.prototype, "active", 2)
    __decorateClass([r5()], EditorButtonControl.prototype, "title", 2)
    __decorateClass([r5()], EditorButtonControl.prototype, "icon", 2)
    __decorateClass([r5()], EditorButtonControl.prototype, "titleProp", 2)

    // src/blocks/CloudImageEditor/src/EditorAspectRatioButtonControl.ts
    var SIZE_RECT_FIXED = 12
    var SIZE_SVG_WRAPPER = 16
    var getAdjustResolutions = (value) => {
        let width = 12
        let height = 12
        const adjustResolutions = value.width / value.height
        if (adjustResolutions >= 1) {
            width = SIZE_RECT_FIXED
            height = Math.round((SIZE_RECT_FIXED * value.height) / value.width)
        } else {
            height = SIZE_RECT_FIXED
            width = Math.round((SIZE_RECT_FIXED * value.width) / value.height)
        }
        return { width, height }
    }
    var EditorFreeformButtonControl = class extends EditorButtonControl {
        initCallback() {
            super.initCallback()
            this.icon = "arrow-dropdown"
            this.sub("*currentAspectRatio", (opt) => {
                const title = this.Sk(opt)
                this.title = title
                this.titleProp = title
            })
        }
        onClick() {
            this.$["*showListAspectRatio"] = true
        }
        Sk(aspectRatio) {
            if (!aspectRatio) {
                return ""
            }
            return aspectRatio.hasFreeform
                ? this.l10n("freeform-crop")
                : this.l10n("crop-to-shape", {
                      value: `${aspectRatio.width}:${aspectRatio.height}`,
                  })
        }
        render() {
            const clickHandler = this.onClick
            const title = this.title
            return b2`
      <button
        role="option"
        type="button"
        class=${e10(this.buttonClasses)}
        aria-label=${o13(this.titleProp)}
        title=${o13(this.titleProp)}
        @click=${clickHandler}
      >
        <div class="uc-title" ?hidden=${!title}>${title}</div>
        <uc-icon name=${this.icon}></uc-icon>
      </button>
    `
        }
    }
    var EditorAspectRatioButtonControl = class extends EditorButtonControl {
        constructor() {
            super(...arguments)
            this._ = null
        }
        get aspectRatio() {
            return this._
        }
        set aspectRatio(value) {
            if (this._ === value) {
                return
            }
            const previous = this._
            this._ = value
            this.requestUpdate("aspectRatio", previous)
            if (value) {
                this.Jh(value)
            } else {
                this.removeAttribute("uc-aspect-ratio-freeform")
                this.title = ""
                this.titleProp = ""
            }
        }
        initCallback() {
            super.initCallback()
            if (this._) {
                this.Jh(this._)
            }
            this.sub("*currentAspectRatio", (opt) => {
                this.active =
                    (opt && opt.id === this._?.id) ||
                    (opt?.width === this._?.width &&
                        opt?.height === this._?.height)
            })
        }
        onClick() {
            const currentAspectRatio = this.$["*currentAspectRatio"]
            if (currentAspectRatio?.id === this._?.id) {
                return
            }
            this.$["*currentAspectRatio"] = this._
        }
        Jh(value) {
            if (!this.isConnected) return
            const isFreeform = !!value.hasFreeform
            this.toggleAttribute("uc-aspect-ratio-freeform", isFreeform)
            const resolveTitle = () => {
                const titleText = isFreeform
                    ? this.l10n("custom")
                    : `${value.width}:${value.height}`
                this.title = titleText
                return titleText
            }
            const resolveTitleProp = () => {
                const label = this.l10n(
                    "a11y-cloud-editor-apply-aspect-ratio",
                    {
                        name: isFreeform
                            ? this.l10n("custom").toLowerCase()
                            : this.l10n("crop-to-shape", {
                                  value: `${value.width}:${value.height}`,
                              }).toLowerCase(),
                        value: "",
                    }
                )
                this.titleProp = label
                return label
            }
            resolveTitle()
            resolveTitleProp()
            if (!isFreeform) {
                this.requestUpdate()
            }
        }
        Tk() {
            const ratio = this._
            if (!ratio || ratio.hasFreeform) {
                return b2`<uc-icon name=${this.icon}></uc-icon>`
            }
            const { width, height } = getAdjustResolutions(ratio)
            const x2 = (SIZE_SVG_WRAPPER - width) / 2
            const y4 = (SIZE_SVG_WRAPPER - height) / 2
            return b2`
      <uc-icon>
      <svg
        viewBox="0 0 ${SIZE_SVG_WRAPPER} ${SIZE_SVG_WRAPPER}"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x=${x2}
          y=${y4}
          width=${width}
          height=${height}
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linejoin="round"
        ></rect>
      </svg>
      </uc-icon>
    `
        }
        render() {
            const clickHandler = this.onClick
            const title = this.title
            return b2`
      <button
        role="option"
        type="button"
        class=${e10(this.buttonClasses)}
        aria-label=${o13(this.titleProp)}
        title=${o13(this.titleProp)}
        @click=${clickHandler}
      >
        ${this.Tk()}
        <div class="uc-title" ?hidden=${!title}>${title}</div>
      </button>
    `
        }
    }
    __decorateClass(
        [n5({ attribute: false })],
        EditorAspectRatioButtonControl.prototype,
        "aspectRatio",
        1
    )

    // src/blocks/CloudImageEditor/src/EditorCropButtonControl.ts
    function nextAngle(prev) {
        let angle = prev + 90
        angle = angle >= 360 ? 0 : angle
        return angle
    }
    function nextValue(operation, prev) {
        if (operation === "rotate") {
            const angle = typeof prev === "number" ? prev : 0
            return nextAngle(angle)
        }
        if (operation === "mirror" || operation === "flip") {
            return !prev
        }
        throw new Error(`Unsupported operation: ${operation}`)
    }
    var EditorCropButtonControl = class extends EditorButtonControl {
        constructor() {
            super(...arguments)
            this.operation = void 0
        }
        willUpdate(changedProperties) {
            super.willUpdate(changedProperties)
            if (this.operation) {
                this.titleProp = this.l10n("a11y-cloud-editor-apply-crop", {
                    name: this.l10n(this.operation).toLowerCase(),
                })
                this.icon = this.operation
            } else {
                this.icon = ""
                this.titleProp = ""
            }
        }
        onClick(e11) {
            if (!this.operation) {
                return
            }
            const cropper = this.$["*cropperEl"]
            const prev = cropper.getValue(this.operation)
            const next = nextValue(this.operation, prev)
            this.telemetryManager.sendEventCloudImageEditor(
                e11,
                this.$["*tabId"],
                {
                    operation: this.operation,
                    next,
                    prev,
                }
            )
            cropper.setValue(this.operation, next)
        }
    }
    __decorateClass(
        [n5({ type: String })],
        EditorCropButtonControl.prototype,
        "operation",
        2
    )

    // src/blocks/CloudImageEditor/src/EditorFilterControl.ts
    var EditorFilterControl = class extends EditorButtonControl {
        constructor() {
            super(...arguments)
            this.f = ""
            this.q = ""
            this.Wb = ""
            this.Uc = 0
            this.g = null
            this.sb = false
            this.isOriginal = false
            this.Kh = 20
        }
        get filter() {
            return this.q
        }
        set filter(value) {
            const nextFilter = value ?? ""
            if (this.q === nextFilter) {
                return
            }
            const previousValue = this.q
            this.q = nextFilter
            this.f = "filter"
            this.isOriginal = nextFilter === FAKE_ORIGINAL_FILTER
            this.icon = this.isOriginal ? "original" : "slider"
            this.Kh = this.isOriginal ? 40 : 20
            this.requestUpdate("filter", previousValue)
            if (this.isConnected) {
                this.Lh(nextFilter)
            }
        }
        onClick(e11) {
            if (!this.active) {
                const slider = this.$["*sliderEl"]
                slider.setOperation(this.f, this.q)
                slider.apply()
            } else if (!this.isOriginal) {
                const slider = this.$["*sliderEl"]
                slider.setOperation(this.f, this.q)
                this.$["*showSlider"] = true
            }
            this.telemetryManager.sendEventCloudImageEditor(
                e11,
                this.$["*tabId"],
                {
                    operation: parseFilterValue(this.$["*operationTooltip"]),
                }
            )
            this.$["*currentFilter"] = this.q
        }
        Uk() {
            const cssSize = parseInt(
                window
                    .getComputedStyle(this)
                    .getPropertyValue("--l-base-min-width"),
                10
            )
            const previewSize =
                Number.isFinite(cssSize) && cssSize > 0
                    ? cssSize
                    : this.Kh || 32
            const dpr = window.devicePixelRatio
            const size = Math.ceil(dpr * previewSize)
            const quality = dpr >= 2 ? "lightest" : "normal"
            const filterValue = 100
            const transformations = { ...this.$["*editorTransformations"] }
            transformations[this.f] =
                this.q !== FAKE_ORIGINAL_FILTER
                    ? {
                          name: this.q,
                          amount: filterValue,
                      }
                    : void 0
            return createCdnUrl(
                this.Wb,
                createCdnUrlModifiers(
                    COMMON_OPERATIONS,
                    transformationsToOperations(transformations),
                    `quality/${quality}`,
                    `scale_crop/${size}x${size}/center`,
                    `@clib/${PACKAGE_NAME}/${PACKAGE_VERSION}/uc-cloud-image-editor/`
                )
            )
        }
        async Ib(entries, observer) {
            const intersectionEntry = entries[0]
            if (intersectionEntry?.isIntersecting) {
                await this.Qe(observer)
            } else {
                this.s?.()
            }
        }
        initCallback() {
            super.initCallback()
            this.e = new window.IntersectionObserver(this.Ib.bind(this), {
                threshold: [0, 1],
            })
            const originalUrl = this.$["*originalUrl"]
            this.Wb = originalUrl ?? ""
            this.sub("*originalUrl", (nextUrl) => {
                this.Wb = nextUrl ?? ""
                if (
                    !this.isOriginal &&
                    this.Wb &&
                    this.isConnected &&
                    !this.g
                ) {
                    this.e?.observe(this)
                    this.Wa()
                }
            })
            if (!this.isOriginal) {
                this.e?.observe(this)
                this.Wa()
            }
            if (this.q) {
                this.Lh(this.q)
            }
            this.sub("*currentFilter", (currentFilter) => {
                this.active = !!(currentFilter && currentFilter === this.q)
            })
            this.sub("*networkProblems", async (networkProblems) => {
                if (networkProblems) {
                    return
                }
                if (this.g) {
                    await this.Qe()
                } else {
                    this.Wa()
                }
            })
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.e?.disconnect()
            this.s?.()
            this.Vc()
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("isOriginal")) {
                if (this.isOriginal) {
                    this.e?.unobserve(this)
                } else {
                    this.e?.observe(this)
                    this.Wa()
                }
            }
        }
        Lh(filterName) {
            if (!filterName) {
                this.titleProp = ""
                return
            }
            const label = this.l10n("a11y-cloud-editor-apply-filter", {
                name: filterName.toLowerCase(),
            })
            this.titleProp = label
        }
        async Qe(observer) {
            if (!this.isConnected) {
                observer?.unobserve(this)
                this.s?.()
                this.s = void 0
                return
            }
            if (!this.Wb) {
                if (!this.rb && !this.Ga) {
                    this.Wa()
                }
                return
            }
            const requestId = ++this.Uc
            let src = ""
            try {
                src = await this.proxyUrl(this.Uk())
            } catch (err) {
                this.$["*networkProblems"] = true
                console.error("Failed to resolve preview URL", { error: err })
                return
            }
            this.sb = false
            this.s?.()
            const { promise, cancel } = preloadImage(src)
            this.s = () => {
                cancel()
                if (this.Uc === requestId) {
                    this.s = void 0
                }
            }
            try {
                await promise
                if (this.Uc !== requestId || !this.isConnected) {
                    return
                }
                this.g = src
                this.sb = true
                this.Vc()
                ;(observer ?? this.e)?.unobserve(this)
            } catch (err) {
                this.$["*networkProblems"] = true
                console.error("Failed to load image", { error: err })
                this.Wa()
            } finally {
                if (this.Uc === requestId) {
                    this.s = void 0
                }
            }
        }
        Wa() {
            if (
                !this.isConnected ||
                this.g ||
                this.sb ||
                this.isOriginal ||
                this.$["*networkProblems"]
            ) {
                this.Vc()
                return
            }
            if (this.Ga) {
                cancelAnimationFrame(this.Ga)
            }
            this.Ga = requestAnimationFrame(() => {
                this.Ga = void 0
                if (!this.isConnected || this.g || this.sb || this.isOriginal) {
                    this.Vc()
                    return
                }
                const rect = this.getBoundingClientRect()
                const hasSize = rect.width > 0 && rect.height > 0
                const viewportWidth =
                    window.innerWidth || document.documentElement.clientWidth
                const viewportHeight =
                    window.innerHeight || document.documentElement.clientHeight
                const isVisible =
                    hasSize &&
                    rect.bottom > 0 &&
                    rect.right > 0 &&
                    rect.top < viewportHeight &&
                    rect.left < viewportWidth
                if (isVisible) {
                    void this.Qe()
                    return
                }
                this.rb = window.setTimeout(() => {
                    this.rb = void 0
                    this.Wa()
                }, 500)
            })
        }
        Vc() {
            if (this.Ga) {
                cancelAnimationFrame(this.Ga)
                this.Ga = void 0
            }
            if (this.rb) {
                window.clearTimeout(this.rb)
                this.rb = void 0
            }
        }
        get Vk() {
            return Boolean(this.sb && !this.active && !this.isOriginal)
        }
        render() {
            const clickHandler = this.onClick
            const previewStyles = {
                opacity: this.Vk ? "1" : "0",
            }
            if (this.g) {
                previewStyles.backgroundImage = `url(${this.g})`
            }
            const iconStyles = {
                opacity: this.active || this.isOriginal ? "1" : "0",
            }
            return b2`
      <button
        role="option"
        type="button"
        class=${e10(this.buttonClasses)}
        aria-label=${o13(this.titleProp)}
        title=${o13(this.titleProp)}
        @click=${clickHandler}
      >
        <div class="uc-preview" ?data-loaded=${this.sb} style=${o11(previewStyles)}></div>
        <uc-icon
          class=${e10({ "uc-original-icon": this.isOriginal })}
          name=${this.icon}
          style=${o11(iconStyles)}
        ></uc-icon>
      </button>
    `
        }
    }
    __decorateClass(
        [r5()],
        EditorFilterControl.prototype,
        /* @__KEY__ */ "g",
        2
    )
    __decorateClass(
        [r5()],
        EditorFilterControl.prototype,
        /* @__KEY__ */ "sb",
        2
    )
    __decorateClass([r5()], EditorFilterControl.prototype, "isOriginal", 2)
    __decorateClass(
        [r5()],
        EditorFilterControl.prototype,
        /* @__KEY__ */ "Kh",
        2
    )
    __decorateClass(
        [n5({ type: String })],
        EditorFilterControl.prototype,
        "filter",
        1
    )

    // src/blocks/CloudImageEditor/src/EditorOperationControl.ts
    var EditorOperationControl = class extends EditorButtonControl {
        constructor() {
            super(...arguments)
            this.f = ""
        }
        get operation() {
            return this.f
        }
        set operation(value) {
            const normalizedValue = value ?? ""
            if (this.f === normalizedValue) {
                return
            }
            const previousValue = this.f
            this.f = normalizedValue
            this.requestUpdate("operation", previousValue)
            if (this.isConnected && normalizedValue) {
                this.Mh(normalizedValue)
            }
        }
        Mh(operation) {
            this.icon = operation
            const resolveTitleProp = () => {
                const label = this.l10n("a11y-cloud-editor-apply-tuning", {
                    name: this.l10n(operation).toLowerCase(),
                })
                this.titleProp = label
                return label
            }
            const resolveTitle = () => {
                const titleText = this.l10n(operation)
                this.title = titleText
                return titleText
            }
            resolveTitleProp()
            resolveTitle()
        }
        initCallback() {
            super.initCallback()
            if (this.f) {
                this.Mh(this.f)
            }
            this.sub("*editorTransformations", (editorTransformations) => {
                if (!this.f) {
                    return
                }
                const { zero } = COLOR_OPERATIONS_CONFIG[this.f]
                const value = editorTransformations[this.f]
                const isActive =
                    typeof value !== "undefined" ? value !== zero : false
                this.active = isActive
            })
        }
        onClick(e11) {
            const slider = this.$["*sliderEl"]
            slider?.setOperation(this.f)
            this.$["*showSlider"] = true
            this.$["*currentOperation"] = this.f
            this.telemetryManager.sendEventCloudImageEditor(
                e11,
                this.$["*tabId"],
                {
                    operation: parseFilterValue(this.$["*operationTooltip"]),
                }
            )
        }
    }
    __decorateClass(
        [n5({ type: String })],
        EditorOperationControl.prototype,
        "operation",
        1
    )

    // src/blocks/CloudImageEditor/src/EditorScroller.ts
    var X_THRESHOLD = 1
    var noopScrollListener = () => {}
    var EditorScroller = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.hiddenScrollbar = false
            this.Nh = (event) => {
                event.preventDefault()
                const { deltaY, deltaX } = event
                if (Math.abs(deltaX) > X_THRESHOLD) {
                    this.scrollLeft += deltaX
                    return
                }
                this.scrollLeft += deltaY
            }
        }
        connectedCallback() {
            super.connectedCallback()
            this.addEventListener("wheel", this.Nh, { passive: false })
            this.addEventListener("scroll", noopScrollListener, {
                passive: true,
            })
        }
        disconnectedCallback() {
            this.removeEventListener("wheel", this.Nh)
            this.removeEventListener("scroll", noopScrollListener)
            super.disconnectedCallback()
        }
    }
    __decorateClass(
        [
            n5({
                type: Boolean,
                noAccessor: true,
                attribute: "hidden-scrollbar",
            }),
        ],
        EditorScroller.prototype,
        "hiddenScrollbar",
        2
    )

    // src/blocks/CloudImageEditor/src/EditorToolbar.ts
    var EditorToolbar = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.Xb = false
            this.showMainToolbar = true
            this.showSubToolbar = false
            this.Oh = true
            this.tabList = [...ALL_TABS]
            this.activeTab = TabId.CROP
            this.Wc = true
            this.Re = false
            this.Ph = null
            this.Qh = 0
            this.Rh = 0
            this.Xc = e9()
            this.Sh = e9()
            this.tabToggleRefs = {
                [TabId.CROP]: e9(),
                [TabId.TUNING]: e9(),
                [TabId.FILTERS]: e9(),
            }
            this.Th = () => {
                this.Xa()
            }
            this.Yb = []
            this.Yc = debounce((show) => {
                this.Xb = show
            }, 500)
            this.Zc = debounce(() => {
                const transformations = this.$["*editorTransformations"]
                const currentOperation = this.$["*currentOperation"]
                let text = ""
                let visible = false
                if (this.$["*tabId"] === TabId.FILTERS) {
                    visible = true
                    if (
                        this.$["*currentFilter"] &&
                        transformations?.filter?.name ===
                            this.$["*currentFilter"]
                    ) {
                        const value = transformations?.filter?.amount || 100
                        text = `${this.$["*currentFilter"]} ${value}`
                    } else {
                        text = this.l10n(FAKE_ORIGINAL_FILTER)
                    }
                } else if (
                    this.showSubToolbar &&
                    this.$["*tabId"] === TabId.TUNING &&
                    currentOperation
                ) {
                    visible = true
                    const value =
                        transformations?.[currentOperation] ||
                        COLOR_OPERATIONS_CONFIG[currentOperation].zero
                    text = `${this.l10n(currentOperation)} ${value}`
                }
                if (visible) {
                    this.$["*operationTooltip"] = text
                }
                this.Re = visible
            }, 0)
            this.Wk = {
                hidden: "uc-sub-toolbar--top-hidden",
                visible: "uc-sub-toolbar--visible",
            }
            this.Xk = {
                hidden: "uc-sub-toolbar--bottom-hidden",
                visible: "uc-sub-toolbar--visible",
            }
            this.Yk = {
                hidden: "uc-tab-toggle--hidden",
                visible: "uc-tab-toggle--visible",
            }
            this.Zk = {
                hidden: "uc-tab-toggles--hidden",
                visible: "uc-tab-toggles--visible",
            }
            this.init$ = {
                ...this.init$,
                "*sliderEl": null,
                "*showSlider": false,
                "*showListAspectRatio": false,
                "*currentFilter": FAKE_ORIGINAL_FILTER,
                "*currentOperation": null,
                "*operationTooltip": null,
            }
            this.ta = (e11) => {
                this.telemetryManager.sendEventCloudImageEditor(
                    e11,
                    this.$["*tabId"],
                    {
                        action: "cancel",
                    }
                )
                this.s?.()
                const onCancel2 = this.$["*on.cancel"]
                onCancel2?.()
            }
            this.Ve = (e11) => {
                this.telemetryManager.sendEventCloudImageEditor(
                    e11,
                    this.$["*tabId"],
                    {
                        action: "apply",
                    }
                )
                const onApply = this.$["*on.apply"]
                onApply?.(this.$["*editorTransformations"])
            }
            this.jl = (e11) => {
                this.telemetryManager.sendEventCloudImageEditor(
                    e11,
                    this.$["*tabId"],
                    {
                        action: "apply-slider",
                        operation: parseFilterValue(
                            this.$["*operationTooltip"]
                        ),
                    }
                )
                const slider = this.Xc.value
                slider?.apply()
                this.Uh()
            }
            this.kl = (e11) => {
                this.telemetryManager.sendEventCloudImageEditor(
                    e11,
                    this.$["*tabId"],
                    {
                        action: "cancel-slider",
                    }
                )
                const slider = this.Xc.value
                slider?.cancel()
                this.Uh()
            }
            this.ll = (e11) => {
                const target = e11.currentTarget
                const id = target?.getAttribute("data-id")
                if (!id) {
                    return
                }
                this.telemetryManager.sendEventCloudImageEditor(e11, id)
                this.Se(id, { fromViewer: false })
            }
        }
        Uh() {
            this.$["*showSlider"] = false
            if (this.$["*tabId"] === TabId.CROP) {
                this.$["*showListAspectRatio"] = false
            }
            if (this.$["*tabId"] === TabId.TUNING) {
                this.Re = false
            }
        }
        Se(id, { fromViewer = false, force = false } = {}) {
            if (this.$["*tabId"] !== id) {
                this.$["*tabId"] = id
            }
            this.Vh(id, { fromViewer, force })
        }
        Vh(id, { fromViewer, force = false }) {
            if (!force && this.activeTab === id) {
                this.Xa()
                return
            }
            this.activeTab = id
            const faderEl = this.$["*faderEl"]
            const cropperEl = this.$["*cropperEl"]
            if (id === TabId.CROP) {
                faderEl?.deactivate()
                const imageSize = this.$["*imageSize"]
                if (imageSize) {
                    cropperEl?.activate(this.$["*imageSize"], { fromViewer })
                }
            } else {
                faderEl?.activate({
                    url: this.$["*originalUrl"],
                    fromViewer,
                })
                cropperEl?.deactivate()
            }
            for (const tabId of ALL_TABS) {
                const isCurrentTab = tabId === id
                const toggleRef = this.tabToggleRefs[tabId]
                const toggleEl = toggleRef?.value
                if (toggleEl) {
                    toggleEl.active = isCurrentTab
                }
                if (isCurrentTab) {
                    this.Xa()
                }
            }
        }
        Xa() {
            const toggleRef = this.tabToggleRefs[this.activeTab]
            const toggleEl = toggleRef?.value
            const indicatorEl = this.Sh.value
            if (!toggleEl || !indicatorEl) {
                return
            }
            const offset = toggleEl.offsetLeft
            const width =
                toggleEl.offsetWidth ||
                Number(getComputedStyle(toggleEl).width.replace("px", ""))
            if (this.Qh !== offset || this.Rh !== width) {
                this.Qh = offset
                this.Rh = width
                indicatorEl.style.transform = `translateX(${offset}px)`
                indicatorEl.style.width = `${width}px`
            }
        }
        get Te() {
            return this.Yb.length >= 3
        }
        _k(tabId) {
            switch (tabId) {
                case TabId.CROP:
                    return this.$k()
                case TabId.FILTERS:
                    return this.al()
                case TabId.TUNING:
                    return this.bl()
                default:
                    return []
            }
        }
        $k() {
            const renderers = []
            if (this.Te) {
                renderers.push(() => this.cl())
            } else {
                for (const preset of this.Yb) {
                    renderers.push(() => this.Wh(preset))
                }
            }
            for (const operation of ALL_CROP_OPERATIONS) {
                renderers.push(() => this.dl(operation))
            }
            return this.Ue(renderers)
        }
        al() {
            const filterIds = [FAKE_ORIGINAL_FILTER, ...ALL_FILTERS]
            const renderers = filterIds.map(
                (filterId) => () => this.fl(filterId)
            )
            return this.Ue(renderers)
        }
        bl() {
            const renderers = ALL_COLOR_OPERATIONS.map(
                (operation) => () => this.gl(operation)
            )
            return this.Ue(renderers)
        }
        Ue(renderers) {
            const total = renderers.length
            if (!total) {
                return []
            }
            return renderers.map((renderControl) => renderControl())
        }
        cl() {
            return b2`<uc-editor-freeform-button-control></uc-editor-freeform-button-control>`
        }
        Wh(preset) {
            return b2`<uc-editor-aspect-ratio-button-control .aspectRatio=${preset}></uc-editor-aspect-ratio-button-control>`
        }
        dl(operation) {
            return b2`<uc-editor-crop-button-control .operation=${operation}></uc-editor-crop-button-control>`
        }
        fl(filterId) {
            return b2`<uc-editor-filter-control .filter=${filterId}></uc-editor-filter-control>`
        }
        gl(operation) {
            return b2`<uc-editor-operation-control .operation=${operation}></uc-editor-operation-control>`
        }
        hl() {
            if (!this.Te) {
                return []
            }
            return this.Yb.map((preset) => this.Wh(preset))
        }
        async il() {
            if (this.$["*imgContainerEl"] && this.$["*originalUrl"]) {
                const width = this.$["*imgContainerEl"].offsetWidth
                const src = await this.proxyUrl(
                    viewerImageSrc(
                        this.$["*originalUrl"],
                        width,
                        this.$["*editorTransformations"]
                    )
                )
                this.s?.()
                const { cancel } = batchPreloadImages([src])
                this.s = () => {
                    cancel()
                    this.s = void 0
                }
            }
        }
        initCallback() {
            super.initCallback()
            const initialCropPresets = this.$["*cropPresetList"] ?? []
            this.Yb = [...initialCropPresets]
            this.sub("*cropPresetList", (cropPresetList) => {
                this.Yb = [...(cropPresetList ?? [])]
            })
            this.sub("*imageSize", (imageSize) => {
                if (imageSize) {
                    setTimeout(() => {
                        this.Se(this.$["*tabId"], { fromViewer: true })
                    }, 0)
                }
            })
            this.sub("*editorTransformations", (editorTransformations) => {
                const appliedFilter = editorTransformations?.filter?.name
                if (this.$["*currentFilter"] !== appliedFilter) {
                    this.$["*currentFilter"] = appliedFilter ?? ""
                }
            })
            this.sub("*currentFilter", () => {
                this.Zc()
            })
            this.sub("*currentOperation", () => {
                this.Zc()
            })
            this.sub("*tabId", (tabId) => {
                this.Vh(tabId, { fromViewer: false, force: true })
                this.Zc()
            })
            this.sub("*originalUrl", () => {
                this.$["*faderEl"]?.deactivate()
            })
            this.sub("*editorTransformations", (transformations) => {
                this.il()
                this.$["*faderEl"]?.setTransformations(transformations)
            })
            this.sub("*loadingOperations", (loadingOperations) => {
                let anyLoading = false
                for (const [, mapping2] of loadingOperations.entries()) {
                    if (anyLoading) {
                        break
                    }
                    for (const [, loading] of mapping2.entries()) {
                        if (loading) {
                            anyLoading = true
                            break
                        }
                    }
                }
                this.Yc(anyLoading)
            })
            this.sub("*showSlider", (showSlider) => {
                if (showSlider) {
                    this.showSubToolbar = true
                    this.showMainToolbar = false
                    this.Wc = true
                } else if (!this.$["*showListAspectRatio"]) {
                    this.showSubToolbar = false
                    this.showMainToolbar = true
                }
            })
            this.sub("*showListAspectRatio", (show) => {
                if (show) {
                    this.showSubToolbar = true
                    this.showMainToolbar = false
                    this.Wc = false
                } else if (!this.$["*showSlider"]) {
                    this.showSubToolbar = false
                    this.showMainToolbar = true
                }
            })
            this.sub("*tabList", (tabList) => {
                this.tabList = tabList
                this.Oh = tabList.length > 1
                if (!tabList.includes(this.$["*tabId"]) && tabList.length > 0) {
                    const [firstTab] = tabList
                    if (firstTab) {
                        this.Se(firstTab, { fromViewer: false })
                    }
                    return
                }
                this.Xa()
            })
            this.sub("*operationTooltip", (tooltip) => {
                this.Ph = tooltip
            })
            this.Zc()
        }
        connectedCallback() {
            super.connectedCallback()
            window.addEventListener("resize", this.Th)
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this._c()
            this.Xa()
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (
                changedProperties.has("activeTab") ||
                changedProperties.has("tabList")
            ) {
                this.updateComplete.then(() => this.Xa())
            }
            if (
                changedProperties.has("showSubToolbar") ||
                changedProperties.has("showMainToolbar")
            ) {
                this._c()
            }
        }
        disconnectedCallback() {
            window.removeEventListener("resize", this.Th)
            super.disconnectedCallback()
            this.$["*showSlider"] = false
            this.$["*showListAspectRatio"] = false
        }
        _c() {
            const slider = this.Xc.value
            if (slider) {
                this.$["*sliderEl"] = slider
            }
        }
        ml(id) {
            const isVisible = this.tabList.includes(id)
            const isActive = this.activeTab === id
            const columnIndex = this.tabList.indexOf(id)
            const style =
                columnIndex >= 0 ? o11({ gridColumn: `${columnIndex + 1}` }) : A
            return b2`
      <uc-presence-toggle class="uc-tab-toggle" .visible=${isVisible} .styles=${this.Yk}>
        <uc-btn-ui
          theme="tab"
          data-id=${id}
          icon=${id}
          role="tab"
          aria-controls=${`tab_${id}`}
          aria-selected=${isActive ? "true" : "false"}
          title-prop=${`a11y-editor-tab-${id}`}
          .active=${isActive}
          style=${style}
          @click=${this.ll}
          ${n7(this.tabToggleRefs[id])}
        ></uc-btn-ui>
      </uc-presence-toggle>
    `
        }
        nl(id) {
            const controls = this._k(id)
            return b2`
      <div
        id=${`tab_${id}`}
        class="uc-tab-content"
      >
        <uc-editor-scroller hidden-scrollbar>
          <div class="uc-controls-list_align">
            <div role="listbox" aria-orientation="horizontal" class="uc-controls-list_inner">
              ${controls.length ? controls : A}
            </div>
          </div>
        </uc-editor-scroller>
      </div>
    `
        }
        render() {
            const tooltipClasses = [
                "uc-info-tooltip",
                this.Re ? "uc-info-tooltip_visible" : "uc-info-tooltip_hidden",
            ].join(" ")
            const showAspectRatioList = this.Te
            return b2`
      <uc-line-loader-ui .active=${this.Xb}></uc-line-loader-ui>
      <div class="uc-info-tooltip_container">
        <div class="uc-info-tooltip_wrapper">
          <div class=${tooltipClasses}>${this.Ph ?? ""}</div>
        </div>
      </div>
      <div class="uc-toolbar-container">
        <uc-presence-toggle
          role="tablist"
          class="uc-sub-toolbar"
          .visible=${this.showMainToolbar}
          .styles=${this.Wk}
        >
          <div class="uc-tab-content-row">
            ${ALL_TABS.map((tabId) => n9(this.activeTab === tabId, () => this.nl(tabId)))}
          </div>
          <div class="uc-controls-row">
            <uc-presence-toggle
              class="uc-tab-toggles"
              .visible=${this.Oh}
              .styles=${this.Zk}
              @initial-render=${() => this.Xa()}
            >
              <div
                class="uc-tab-toggles_indicator"
                ${n7(this.Sh)}
              ></div>
              ${ALL_TABS.map((tabId) => this.ml(tabId))}
            </uc-presence-toggle>
            <uc-btn-ui
              style="order: -1"
              theme="secondary-icon"
              icon="closeMax"
              title-prop="cancel"
              @click=${this.ta}
            ></uc-btn-ui>
            <uc-btn-ui theme="primary-icon" icon="done" title-prop="apply" @click=${this.Ve}></uc-btn-ui>
          </div>
        </uc-presence-toggle>
        <uc-presence-toggle class="uc-sub-toolbar" .visible=${this.showSubToolbar} .styles=${this.Xk}>
          <div class="uc-slider" ?hidden=${!this.Wc}>
            <uc-editor-slider ${n7(this.Xc)}></uc-editor-slider>
          </div>

          <div class="uc-list-aspect-ratio-container" ?hidden=${this.Wc || !showAspectRatioList}>
            ${showAspectRatioList ? b2`<div class="uc-list-aspect-ratio">${this.hl()}</div>` : A}
          </div>
          <div class="uc-controls-row">
            <uc-btn-ui theme="secondary" @click=${this.kl} text=${this.l10n("cancel")}></uc-btn-ui>
            <uc-btn-ui theme="primary" @click=${this.jl} text=${this.l10n("apply")}></uc-btn-ui>
          </div>
        </uc-presence-toggle>
      </div>
    `
        }
    }
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Xb", 2)
    __decorateClass([r5()], EditorToolbar.prototype, "showMainToolbar", 2)
    __decorateClass([r5()], EditorToolbar.prototype, "showSubToolbar", 2)
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Oh", 2)
    __decorateClass([r5()], EditorToolbar.prototype, "tabList", 2)
    __decorateClass([r5()], EditorToolbar.prototype, "activeTab", 2)
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Wc", 2)
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Re", 2)
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Ph", 2)
    __decorateClass([r5()], EditorToolbar.prototype, /* @__KEY__ */ "Yb", 2)

    // src/blocks/CloudImageEditor/src/CloudImageEditorBlock.ts
    var DEFAULT_TABS = serializeCsv([...ALL_TABS])
    var CloudImageEditorBlock = class extends LitBlock {
        constructor() {
            super(...arguments)
            this.ctxOwner = true
            this.ol = ""
            this.Va = TRANSPARENT_PIXEL_SRC
            this.pl = ""
            this.Xb = false
            this.uuid = null
            this.cdnUrl = null
            this.cropPreset = ""
            this.tabs = DEFAULT_TABS
            this.Xh = false
            this.xa = false
            this.We = null
            this.Zb = null
            this.Yc = debounce((show) => {
                this.Xb = show
            }, 300)
            this.$c = e9()
            this.Yh = e9()
            this.Zh = e9()
            this._h = e9()
            this.$h = () => {
                this.Yc(false)
                if (this.Va !== TRANSPARENT_PIXEL_SRC) {
                    this.$["*networkProblems"] = false
                }
            }
            this.ai = () => {
                this.Yc(false)
                this.$["*networkProblems"] = true
            }
            this.ql = () => {
                const retry = this.$["*on.retryNetwork"]
                retry?.()
            }
            this.init$ = {
                ...this.init$,
                ...initState(this),
            }
        }
        static {
            this.styleAttrs = ["uc-cloud-image-editor"]
        }
        rl() {
            if (this.xa || this.We) {
                return
            }
            this.We = this.updateComplete.then(() => {
                this.We = null
                this.xa = true
            })
        }
        initCallback() {
            super.initCallback()
            this.bi()
            this.ci()
        }
        _c() {
            const faderEl = this.Zh.value
            if (faderEl) {
                this.$["*faderEl"] = faderEl
            }
            const cropperEl = this.Yh.value
            if (cropperEl) {
                this.$["*cropperEl"] = cropperEl
            }
            const imgContainerEl = this._h.value
            if (imgContainerEl) {
                this.$["*imgContainerEl"] = imgContainerEl
            }
            const imgEl = this.$c.value
            if (imgEl) {
                this.$["*imgEl"] = imgEl
            }
        }
        sl() {
            const imgEl = this.$c.value
            if (!imgEl) {
                return
            }
            imgEl.addEventListener("load", this.$h)
            imgEl.addEventListener("error", this.ai)
        }
        tl() {
            const imgEl = this.$c.value
            if (!imgEl) {
                return
            }
            imgEl.removeEventListener("load", this.$h)
            imgEl.removeEventListener("error", this.ai)
        }
        get ul() {
            const tabId = this.$["*tabId"]
            return classNames("uc-image", {
                "uc-image_hidden_to_cropper": tabId === TabId.CROP,
                "uc-image_hidden_effects": tabId !== TabId.CROP,
            })
        }
        /**
         * To proper work, we need non-zero size the element. So, we'll wait for it.
         */
        di() {
            if (this.Zb) {
                return this.Zb
            }
            const TIMEOUT = 3e3
            this.Zb = new Promise((resolve, reject) => {
                const cleanup = () => {
                    window.clearTimeout(timeoutId)
                    resizeObserver.disconnect()
                    this.Zb = null
                }
                const hasNonZeroSize = () => {
                    const { width, height } = this.getBoundingClientRect()
                    return width > 0 && height > 0
                }
                const resolveWait = () => {
                    cleanup()
                    window.setTimeout(() => resolve(), 0)
                }
                const rejectWait = () => {
                    const error = new Error(
                        "[cloud-image-editor] timeout waiting for non-zero container size"
                    )
                    cleanup()
                    if (this.isConnected) {
                        console.error(error.message)
                    }
                    reject(error)
                }
                const resizeObserver = new ResizeObserver((entries) => {
                    const [element] = entries
                    if (!element) {
                        return
                    }
                    if (
                        element.contentRect.width > 0 &&
                        element.contentRect.height > 0
                    ) {
                        resolveWait()
                    }
                })
                const timeoutId = window.setTimeout(() => {
                    rejectWait()
                }, TIMEOUT)
                if (hasNonZeroSize()) {
                    resolveWait()
                    return
                }
                resizeObserver.observe(this)
            })
            return this.Zb
        }
        firstUpdated(changedProperties) {
            super.firstUpdated(changedProperties)
            this._c()
            this.sl()
            void this.initEditor()
            const hasInitialSource = Boolean(this.uuid || this.cdnUrl)
            const alreadyRequested =
                changedProperties.has("uuid") || changedProperties.has("cdnUrl")
            if (hasInitialSource && !alreadyRequested) {
                void this.updateImage()
            }
        }
        disconnectedCallback() {
            this.tl()
            super.disconnectedCallback()
        }
        render() {
            const fileType = this.pl ?? ""
            const message = this.ol ?? ""
            const src = this.Va || TRANSPARENT_PIXEL_SRC
            const showLoader = this.Xb
            const showNetworkProblems = this.Xh
            return b2`
      ${o8(svg_sprite_default2)}
      <div class="uc-wrapper uc-wrapper_desktop">
        <uc-presence-toggle class="uc-network_problems_splash" .visible=${showNetworkProblems}>
          <div class="uc-network_problems_content">
            <div class="uc-network_problems_icon">
              <uc-icon name="sad"></uc-icon>
            </div>
            <div class="uc-network_problems_text">Network error</div>
          </div>
          <div class="uc-network_problems_footer">
            <uc-btn-ui theme="primary" text="Retry" @click=${this.ql}></uc-btn-ui>
          </div>
        </uc-presence-toggle>
        <div class="uc-viewport">
          <div class="uc-file_type_outer">
            <div class="uc-file_type">${fileType}</div>
          </div>
          <div class="uc-image_container" ${n7(this._h)}>
            <img src=${src} class=${this.ul} ${n7(this.$c)} />
            ${n9(this.xa, () => b2`<uc-editor-image-cropper ${n7(this.Yh)}></uc-editor-image-cropper>`)}
            <uc-editor-image-fader ${n7(this.Zh)}></uc-editor-image-fader>
          </div>
          <div class="uc-info_pan">${message}</div>
        </div>
        <div class="uc-toolbar">
          <uc-line-loader-ui .active=${showLoader}></uc-line-loader-ui>
          <div class="uc-toolbar_content uc-toolbar_content__editor">
            ${n9(this.xa, () => b2`<uc-editor-toolbar></uc-editor-toolbar>`)}
          </div>
        </div>
      </div>
    `
        }
        updated(changedProperties) {
            super.updated(changedProperties)
            if (changedProperties.has("uuid") && this.uuid) {
                void this.updateImage()
            }
            if (changedProperties.has("cdnUrl") && this.cdnUrl) {
                void this.updateImage()
            }
            if (changedProperties.has("tabs")) {
                this.bi()
            }
            if (
                changedProperties.has("cropPreset") ||
                changedProperties.has("cdnUrl")
            ) {
                this.ci()
            }
        }
        bi() {
            const tabsValue = this.tabs || DEFAULT_TABS
            this.$["*tabList"] = parseTabs(tabsValue)
        }
        ci() {
            const list = parseCropPreset(this.cropPreset ?? "")
            let closest = null
            if (this.cdnUrl) {
                const operations = extractOperations(this.cdnUrl)
                const transformations = operationsToTransformations(operations)
                if (Array.isArray(transformations?.crop?.dimensions)) {
                    const [w2, h8] = transformations.crop.dimensions
                    closest = getClosestAspectRatio(w2, h8, list, 0.1)
                }
            }
            this.$["*cropPresetList"] = list
            this.$["*currentAspectRatio"] = closest ?? list?.[0] ?? null
        }
        async updateImage() {
            if (!this.isConnected) {
                return
            }
            try {
                await this.di()
            } catch {
                return
            }
            if (!this.isConnected) {
                return
            }
            if (this.cdnUrl) {
                const cdnUrlValue = this.cdnUrl
                const uuid = extractUuid(cdnUrlValue)
                const originalUrl = createOriginalUrl(cdnUrlValue, uuid)
                if (originalUrl === this.$["*originalUrl"]) {
                    return
                }
                this.$["*originalUrl"] = originalUrl
                const operations = extractOperations(cdnUrlValue)
                const transformations = operationsToTransformations(operations)
                this.$["*editorTransformations"] = transformations
            } else if (this.uuid) {
                const originalUrl = createOriginalUrl(
                    this.cfg.cdnCname,
                    this.uuid
                )
                if (originalUrl === this.$["*originalUrl"]) {
                    return
                }
                this.$["*originalUrl"] = originalUrl
                if (Object.keys(this.$["*editorTransformations"]).length > 0) {
                    this.$["*editorTransformations"] = {}
                }
            } else {
                throw new Error("No UUID nor CDN URL provided")
            }
            if (this.$["*tabId"] === TabId.CROP) {
                this.$["*cropperEl"]?.deactivate({ reset: true })
            } else {
                this.$["*faderEl"]?.deactivate()
            }
            try {
                const originalUrlValue = this.$["*originalUrl"]
                const cdnUrl = await this.proxyUrl(
                    createCdnUrl(
                        originalUrlValue,
                        createCdnUrlModifiers("json")
                    )
                )
                const json = await fetch(cdnUrl).then((response2) =>
                    response2.json()
                )
                const { width, height } = json
                this.$["*imageSize"] = { width, height }
                if (this.$["*tabId"] === TabId.CROP) {
                    this.$["*cropperEl"]?.activate(this.$["*imageSize"])
                } else {
                    this.$["*faderEl"]?.activate({ url: originalUrlValue })
                }
            } catch (err) {
                if (err) {
                    this.telemetryManager.sendEventError(
                        err,
                        "cloud editor image. Failed to load image info"
                    )
                    console.error("Failed to load image info", err)
                }
            }
            this.rl()
        }
        async initEditor() {
            try {
                await this.di()
            } catch {
                return
            }
            this.classList.add("uc-editor_ON")
            this.sub("*networkProblems", (networkProblems) => {
                const hasIssues = Boolean(networkProblems)
                this.Xh = hasIssues
            })
            this.sub(
                "*editorTransformations",
                (transformations) => {
                    if (Object.keys(transformations).length === 0) {
                        return
                    }
                    const originalUrl = this.$["*originalUrl"]
                    const cdnUrlModifiers = createCdnUrlModifiers(
                        transformationsToOperations(transformations),
                        "preview"
                    )
                    const cdnUrl = createCdnUrl(originalUrl, cdnUrlModifiers)
                    const eventData = {
                        originalUrl,
                        cdnUrlModifiers,
                        cdnUrl,
                        transformations,
                    }
                    this.dispatchEvent(
                        new CustomEvent("change", {
                            detail: eventData,
                            bubbles: true,
                            composed: true,
                        })
                    )
                },
                false
            )
        }
    }
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "ol",
        2
    )
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "Va",
        2
    )
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "pl",
        2
    )
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "Xb",
        2
    )
    __decorateClass(
        [n5({ type: String, reflect: true })],
        CloudImageEditorBlock.prototype,
        "uuid",
        2
    )
    __decorateClass(
        [n5({ type: String, attribute: "cdn-url", reflect: true })],
        CloudImageEditorBlock.prototype,
        "cdnUrl",
        2
    )
    __decorateClass(
        [n5({ type: String, attribute: "crop-preset", reflect: true })],
        CloudImageEditorBlock.prototype,
        "cropPreset",
        2
    )
    __decorateClass(
        [n5({ type: String, reflect: true })],
        CloudImageEditorBlock.prototype,
        "tabs",
        2
    )
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "Xh",
        2
    )
    __decorateClass(
        [r5()],
        CloudImageEditorBlock.prototype,
        /* @__KEY__ */ "xa",
        2
    )

    // src/blocks/CloudImageEditorActivity/CloudImageEditorActivity.ts
    var CloudImageEditorActivity_exports = {}
    __export(CloudImageEditorActivity_exports, {
        CloudImageEditorActivity: () => CloudImageEditorActivity,
    })

    // src/solutions/cloud-image-editor/CloudImageEditor.ts
    var CloudImageEditor = class extends CloudImageEditorBlock {
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-wgt-common"]
        }
        constructor() {
            super()
            this.init$ = {
                ...this.init$,
                "*solution": this.tagName,
            }
        }
        initCallback() {
            super.initCallback()
            this.telemetryManager.sendEvent({
                eventType: InternalEventType.INIT_SOLUTION,
            })
            this.a11y?.registerBlock(this)
        }
    }

    // src/blocks/CloudImageEditorActivity/CloudImageEditorActivity.ts
    var CloudImageEditorActivity = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.aa = null
        }
        get activityParams() {
            const params = super.activityParams
            if ("internalId" in params) {
                return params
            }
            throw new Error(`Cloud Image Editor activity params not found`)
        }
        initCallback() {
            super.initCallback()
            this.subConfigValue("cropPreset", (cropPreset) => {
                if (!this.aa) {
                    return
                }
                if (this.aa.cropPreset === cropPreset) {
                    return
                }
                this.aa = {
                    ...this.aa,
                    cropPreset,
                }
            })
            this.subConfigValue("cloudImageEditorTabs", (tabs) => {
                if (!this.aa) {
                    return
                }
                if (this.aa.tabs === tabs) {
                    return
                }
                this.aa = {
                    ...this.aa,
                    tabs,
                }
            })
            this.vl()
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.wl()
        }
        Ve(e11) {
            if (!this._b) {
                return
            }
            this.debugPrint(`editor event "apply"`, e11.detail)
            const result = e11.detail
            this._b.setMultipleValues({
                cdnUrl: result.cdnUrl,
                cdnUrlModifiers: result.cdnUrlModifiers,
            })
            this.modalManager?.close(LitActivityBlock.activities.CLOUD_IMG_EDIT)
            this.historyBack()
        }
        ta(event) {
            const detail = event instanceof CustomEvent ? event.detail : void 0
            this.debugPrint(`editor event "cancel"`, detail)
            this.modalManager?.close(LitActivityBlock.activities.CLOUD_IMG_EDIT)
            this.historyBack()
        }
        handleChange(event) {
            this.debugPrint(`editor event "change"`, event.detail)
        }
        vl() {
            const { internalId } = this.activityParams
            const entry = this.uploadCollection.read(internalId)
            if (!entry) {
                throw new Error(
                    `Entry with internalId "${internalId}" not found`
                )
            }
            this._b = entry
            const cdnUrl = this._b.getValue("cdnUrl")
            if (!cdnUrl) {
                throw new Error(
                    `Entry with internalId "${internalId}" hasn't uploaded yet`
                )
            }
            this.aa = this.xl(cdnUrl)
        }
        wl() {
            this._b = void 0
            this.aa = null
        }
        render() {
            if (!this.aa) {
                return A
            }
            const { cdnUrl, cropPreset, tabs } = this.aa
            return b2`
      <uc-cloud-image-editor
        cdn-url=${cdnUrl}
        crop-preset=${o13(cropPreset)}
        tabs=${o13(tabs)}
        @apply=${this.Ve}
        @cancel=${this.ta}
        @change=${this.handleChange}
      ></uc-cloud-image-editor>
    `
        }
        xl(cdnUrl) {
            const config2 = {
                cdnUrl,
                cropPreset: this.cfg.cropPreset,
                tabs: this.cfg.cloudImageEditorTabs,
            }
            return config2
        }
    }
    __decorateClass(
        [r5()],
        CloudImageEditorActivity.prototype,
        /* @__KEY__ */ "aa",
        2
    )

    // src/utils/get-top-level-origin.ts
    var getTopLevelOrigin = () => {
        const topLevelWindow =
            globalThis.top ?? globalThis.parent ?? globalThis.self
        try {
            return topLevelWindow.location.origin
        } catch (e11) {
            console.warn("Unable to access top-level window location:", e11)
            return globalThis.location.origin
        }
    }

    // src/utils/wildcardRegexp.ts
    var escapeRegExp = (str) =>
        str.replace(/[\\-\\[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
    var wildcardRegexp = (str, flags = "i") => {
        const parts = str.split("*").map(escapeRegExp)
        return new RegExp(`^${parts.join(".+")}$`, flags)
    }

    // src/blocks/ExternalSource/buildThemeDefinition.ts
    var ucCustomProperties = [
        "--uc-font-family",
        "--uc-font-size",
        "--uc-line-height",
        "--uc-button-size",
        "--uc-preview-size",
        "--uc-input-size",
        "--uc-padding",
        "--uc-radius",
        "--uc-transition",
        "--uc-background",
        "--uc-foreground",
        "--uc-primary",
        "--uc-primary-hover",
        "--uc-primary-transparent",
        "--uc-primary-foreground",
        "--uc-secondary",
        "--uc-secondary-hover",
        "--uc-secondary-foreground",
        "--uc-muted",
        "--uc-muted-foreground",
        "--uc-destructive",
        "--uc-destructive-foreground",
        "--uc-border",
    ]
    var getCssValue = (element, propName) => {
        const style = window.getComputedStyle(element)
        return style.getPropertyValue(propName).trim()
    }
    var buildThemeDefinition = (element) => {
        const theme = {}
        for (const prop of ucCustomProperties) {
            const value = getCssValue(element, prop)
            if (value) {
                theme[prop] = value
            }
        }
        return theme
    }

    // src/blocks/ExternalSource/MessageBridge.ts
    var MESSAGE_TYPE_WHITELIST = [
        "selected-files-change",
        "toolbar-state-change",
    ]
    var isWhitelistedMessage = (message) => {
        if (!message) return false
        if (typeof message !== "object") return false
        if (!("type" in message)) return false
        const type = message.type
        if (typeof type !== "string") return false
        if (!MESSAGE_TYPE_WHITELIST.includes(type)) return false
        return true
    }
    var MessageBridge = class {
        constructor(context, getTargetOrigin) {
            this.ad = /* @__PURE__ */ new Map()
            this.fi = (e11) => {
                if (e11.source !== this.Xe) {
                    return
                }
                const message = e11.data
                if (!isWhitelistedMessage(message)) {
                    return
                }
                const handlers = this.ad.get(message.type)
                if (handlers) {
                    for (const handler of handlers) {
                        handler(message)
                    }
                }
            }
            this.Xe = context
            this.ei = getTargetOrigin
            window.addEventListener("message", this.fi)
        }
        on(type, handler) {
            const handlers = this.ad.get(type) ?? /* @__PURE__ */ new Set()
            if (!this.ad.has(type)) {
                this.ad.set(type, handlers)
            }
            handlers.add(handler)
        }
        send(message) {
            const targetOrigin = this.ei()
            this.Xe.postMessage(message, targetOrigin)
        }
        destroy() {
            window.removeEventListener("message", this.fi)
        }
    }

    // src/blocks/ExternalSource/query-string.ts
    function queryString(params) {
        const list = []
        for (const [key, value] of Object.entries(params)) {
            if (
                value === void 0 ||
                value === null ||
                (typeof value === "string" && value.length === 0)
            ) {
                continue
            }
            list.push(`${key}=${encodeURIComponent(value)}`)
        }
        return list.join("&")
    }

    // src/blocks/ExternalSource/ExternalSource.ts
    var SOCIAL_SOURCE_MAPPING = {
        [ExternalUploadSource.GDRIVE]: "ngdrive",
    }
    var ExternalSource = class extends LitUploaderBlock {
        constructor() {
            super(...arguments)
            this.couldBeCtxOwner = true
            this.tb = e9()
            this.bd = null
            this.Ye = []
            this.Ze = false
            this._e = false
            this.$e = false
            this.af = false
            this.cd = false
            this.bf = false
            this.cf = "uc-hidden"
            this.gi = true
            this.le = () => {
                for (const message of this.Ye) {
                    const url = this.zl(message)
                    const { filename } = message
                    const { externalSourceType } = this.activityParams
                    this.api.addFileFromUrl(url, {
                        fileName: filename,
                        source: externalSourceType,
                    })
                }
                this.routerLayer.navigateAfterFileAdd()
            }
            this.ta = () => {
                this.historyBack()
            }
            this.Fl = () => {
                this.ha?.send({ type: "select-all" })
            }
            this.Gl = () => {
                this.ha?.send({ type: "deselect-all" })
            }
        }
        get yl() {
            if (!this.bd) {
                return ""
            }
            const { selectedCount, total } = this.bd
            return this.l10n("selected-count", {
                count: selectedCount,
                total,
            })
        }
        get activityParams() {
            const params = super.activityParams
            if ("externalSourceType" in params) {
                return params
            }
            throw new Error(`External Source activity params not found`)
        }
        initCallback() {
            super.initCallback()
            const { externalSourceType } = this.activityParams
            if (!externalSourceType) {
                console.error(
                    `Param "externalSourceType" is required for external source activity`
                )
            } else {
                this.hi()
            }
            this.sub("*currentActivityParams", () => {
                setTimeout(() => {
                    if (!this.isConnected) {
                        return
                    }
                    this.ii()
                    this.hi()
                })
            })
            this.subConfigValue("multiple", (multiple) => {
                this.cd = multiple
            })
            this.subConfigValue("localeName", () => {
                this.ji()
            })
            this.subConfigValue("externalSourcesEmbedCss", (embedCss) => {
                this.ki(embedCss)
            })
        }
        zl(selectedFile) {
            if (selectedFile.alternatives) {
                const preferredTypes = stringToArray(
                    this.cfg.externalSourcesPreferredTypes
                )
                for (const preferredType of preferredTypes) {
                    const regexp = wildcardRegexp(preferredType)
                    for (const [type, typeUrl] of Object.entries(
                        selectedFile.alternatives
                    )) {
                        if (regexp.test(type)) {
                            return typeUrl
                        }
                    }
                }
            }
            return selectedFile.url
        }
        Al(message) {
            this.gi = message.isVisible
        }
        async Bl(message) {
            if (this.cfg.multiple !== message.isMultipleMode) {
                console.error("Multiple mode mismatch")
                return
            }
            this.Cl(message.selectedCount, message.total)
            this.cf = message.isReady ? "" : "uc-hidden"
            this.Ze = message.isReady
            this._e = message.isReady && message.selectedFiles.length > 0
            this.cd = message.isMultipleMode && message.total > 0
            this.$e = message.selectedCount < message.total
            this.af = message.selectedCount === message.total
            this.Ye = message.selectedFiles ?? []
            this.bf = message.total > 0
        }
        li() {
            this.ki(this.cfg.externalSourcesEmbedCss)
            this.Dl()
            this.ji()
        }
        Dl() {
            this.ha?.send({
                type: "set-theme-definition",
                theme: buildThemeDefinition(this),
            })
        }
        ki(css) {
            this.ha?.send({
                type: "set-embed-css",
                css,
            })
        }
        ji() {
            this.ha?.send({
                type: "set-locale-definition",
                localeDefinition: this.cfg.localeName,
            })
        }
        El() {
            const { pubkey, remoteTabSessionKey, socialBaseUrl, multiple } =
                this.cfg
            const { externalSourceType } = this.activityParams
            const sourceName =
                SOCIAL_SOURCE_MAPPING[externalSourceType] ?? externalSourceType
            const lang =
                this.l10n("social-source-lang")?.split("-")?.[0] || "en"
            const params = {
                lang,
                public_key: pubkey,
                images_only: false.toString(),
                session_key: remoteTabSessionKey,
                wait_for_theme: true,
                multiple: multiple.toString(),
                origin: this.cfg.topLevelOrigin || getTopLevelOrigin(),
                debug: this.cfg.debug,
            }
            const url = new URL(`/window4/${sourceName}`, socialBaseUrl)
            url.search = queryString(params)
            return url.toString()
        }
        Cl(selectedCount, total) {
            this.bd = { selectedCount, total }
        }
        hi() {
            const iframe = document.createElement("iframe")
            iframe.src = this.El()
            iframe.marginHeight = 0
            iframe.marginWidth = 0
            iframe.frameBorder = "0"
            iframe.allowTransparency = true
            iframe.addEventListener("load", this.li.bind(this))
            iframe.addEventListener("load", this.li.bind(this))
            if (this.tb.value) {
                this.tb.value.innerHTML = ""
                this.tb.value.appendChild(iframe)
            }
            if (!iframe.contentWindow) {
                return
            }
            this.ha?.destroy()
            this.ha = new MessageBridge(
                iframe.contentWindow,
                () => this.cfg.socialBaseUrl
            )
            this.ha.on("selected-files-change", this.Bl.bind(this))
            this.ha.on("toolbar-state-change", this.Al.bind(this))
            this.mi()
        }
        ii() {
            this.ha?.destroy()
            this.ha = void 0
            if (this.tb.value) {
                this.tb.value.innerHTML = ""
            }
            this.mi()
        }
        mi() {
            this.Ye = []
            this.Ze = false
            this._e = false
            this.$e = false
            this.af = false
            this.cd = false
            this.bf = false
            this.cf = "uc-hidden"
            this.bd = null
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.ii()
        }
        render() {
            return b2`
      <uc-activity-header>
        <button
          type="button"
          class="uc-mini-btn uc-close-btn"
          @click=${this.$["*historyBack"]}
          title=${this.l10n("a11y-activity-header-button-close")}
          aria-label=${this.l10n("a11y-activity-header-button-close")}
        >
          <uc-icon name="close"></uc-icon>
        </button>
      </uc-activity-header>
      <div class="uc-content">
        <div ${n7(this.tb)} class="uc-iframe-wrapper"></div>
        <div class="uc-toolbar" ?hidden=${!this.gi}>
          <button
            type="button"
            class="uc-cancel-btn uc-secondary-btn"
            @click=${this.ta}
          >
            ${this.l10n("cancel")}
          </button>
          <div
            class="uc-selection-status-box"
            ?hidden=${!this.cd}
          >
            <span>${this.yl}</span>
            <button
              type="button"
              @click=${this.Fl}
              ?hidden=${!this.$e}
            >
              ${this.l10n("select-all")}
            </button>
            <button
              type="button"
              @click=${this.Gl}
              ?hidden=${!this.af}
            >
              ${this.l10n("deselect-all")}
            </button>
          </div>
          <button
            type="button"
            class="uc-done-btn uc-primary-btn"
            @click=${this.le}
            ?disabled=${!this._e}
            ?hidden=${!this.bf}
          >
            <uc-spinner ?hidden=${this.Ze}></uc-spinner>
            <span class=${this.cf}>${this.l10n("done")}</span>
          </button>
        </div>
      </div>
    `
        }
    }
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "Ye", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "Ze", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "_e", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "$e", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "af", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "cd", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "bf", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "cf", 2)
    __decorateClass([r5()], ExternalSource.prototype, /* @__KEY__ */ "gi", 2)

    // src/solutions/cloud-image-editor/index.ts
    var cloud_image_editor_exports = {}
    __export(cloud_image_editor_exports, {
        BtnUi: () => BtnUi,
        CloudImageEditor: () => CloudImageEditor,
        CloudImageEditorBlock: () => CloudImageEditorBlock,
        Config: () => Config,
        CropFrame: () => CropFrame,
        EditorAspectRatioButtonControl: () => EditorAspectRatioButtonControl,
        EditorCropButtonControl: () => EditorCropButtonControl,
        EditorFilterControl: () => EditorFilterControl,
        EditorFreeformButtonControl: () => EditorFreeformButtonControl,
        EditorImageCropper: () => EditorImageCropper,
        EditorImageFader: () => EditorImageFader,
        EditorOperationControl: () => EditorOperationControl,
        EditorScroller: () => EditorScroller,
        EditorSlider: () => EditorSlider,
        EditorToolbar: () => EditorToolbar,
        Icon: () => Icon,
        LineLoaderUi: () => LineLoaderUi,
        PresenceToggle: () => PresenceToggle,
        SliderUi: () => SliderUi,
        defineComponents: () => defineComponents,
    })

    // src/plugins/cloudImageEditorPlugin.ts
    var CLOUD_EDITOR_PLUGIN_ID = "cloud-image-editor"
    var EDIT_FILE_ICON_SVG =
        "<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path fill='currentColor' fill-rule='evenodd' d='M18.558 2.804a.78.78 0 0 0-.557.235l-.008.007-2.472 2.46 3.847 3.848 2.46-2.473.004-.003a.78.78 0 0 0 0-1.108l-.004-.003-2.712-2.728a.78.78 0 0 0-.558-.235Zm-.248 7.613-3.852-3.852-8.93 8.887-1.516 5.41 5.41-1.515 8.888-8.93Zm-.636-8.934a2.28 2.28 0 0 1 2.512.505l2.702 2.717.002.002a2.278 2.278 0 0 1 0 3.234l-.002.002-12.541 12.602a.75.75 0 0 1-.33.193l-6.884 1.928a.75.75 0 0 1-.925-.924l1.928-6.885a.75.75 0 0 1 .193-.33l12.603-12.54a2.28 2.28 0 0 1 .742-.504Z' clip-rule='evenodd'/></svg>"
    var cloudImageEditorPlugin = {
        id: CLOUD_EDITOR_PLUGIN_ID,
        setup: async ({ pluginApi, uploaderApi }) => {
            defineComponents({
                ...cloud_image_editor_exports,
                ...CloudImageEditorActivity_exports,
            })
            pluginApi.registry.registerIcon({
                name: "edit-file",
                svg: EDIT_FILE_ICON_SVG,
            })
            pluginApi.registry.registerFileAction({
                id: "edit-file",
                icon: "edit-file",
                label: "file-item-edit-button",
                shouldRender: (fileEntry) =>
                    Boolean(fileEntry.isImage && fileEntry.cdnUrl),
                onClick: (fileEntry) => {
                    uploaderApi.setCurrentActivity?.(
                        ACTIVITY_TYPES.CLOUD_IMG_EDIT,
                        {
                            internalId: fileEntry.internalId,
                        }
                    )
                    uploaderApi.setModalState?.(true)
                },
            })
            pluginApi.registry.registerActivity({
                id: ACTIVITY_TYPES.CLOUD_IMG_EDIT,
                render: (host) => {
                    const activityEl = document.createElement(
                        "uc-cloud-image-editor-activity"
                    )
                    host.append(activityEl)
                    return () => {
                        host.replaceChildren()
                    }
                },
            })
            const unsubscribe = uploaderApi.on(
                EventType.FILE_UPLOAD_SUCCESS,
                (fileEntry) => {
                    if (!fileEntry.isImage) return
                    const cropPreset = pluginApi.config.get("cropPreset")
                    const useEditor = pluginApi.config.get(
                        "useCloudImageEditor"
                    )
                    const autoOpen = pluginApi.config.get(
                        "cloudImageEditorAutoOpen"
                    )
                    const collectionSize = uploaderApi.m.size
                    if (
                        useEditor &&
                        collectionSize === 1 &&
                        (cropPreset || autoOpen)
                    ) {
                        uploaderApi.setCurrentActivity?.(
                            ACTIVITY_TYPES.CLOUD_IMG_EDIT,
                            {
                                internalId: fileEntry.internalId,
                            }
                        )
                        uploaderApi.setModalState?.(true)
                    }
                }
            )
            return unsubscribe
        },
    }

    // src/plugins/externalSourcesPlugin.ts
    var externalSourcesPlugin = {
        id: "external-sources",
        setup: async ({ pluginApi, uploaderApi }) => {
            defineComponents({ ExternalSource })
            pluginApi.registry.registerActivity({
                id: ACTIVITY_TYPES.EXTERNAL,
                render: (host) => {
                    const el = document.createElement("uc-external-source")
                    host.append(el)
                    return () => {
                        host.replaceChildren()
                    }
                },
            })
            for (const sourceId of Object.values(ExternalUploadSource)) {
                pluginApi.registry.registerSource({
                    id: sourceId,
                    label: `src-type-${sourceId}`,
                    icon: sourceId,
                    onSelect: () => {
                        uploaderApi.setCurrentActivity(
                            ACTIVITY_TYPES.EXTERNAL,
                            { externalSourceType: sourceId }
                        )
                        uploaderApi.setModalState(true)
                    },
                })
            }
        },
    }

    // src/plugins/localSourcePlugin.ts
    var localSourcePlugin = {
        id: UploadSource.LOCAL,
        setup: ({ pluginApi, uploaderApi }) => {
            pluginApi.registry.registerSource({
                id: UploadSource.LOCAL,
                label: "src-type-local",
                icon: "local",
                onSelect: () => {
                    uploaderApi.openSystemDialog()
                },
            })
        },
    }

    // src/solutions/file-uploader/lazyPlugins.ts
    var fileUploaderLazyPlugins = [
        {
            configDeps: ["useCloudImageEditor"],
            isEnabled: (get) => !!get("useCloudImageEditor"),
            load: () => cloudImageEditorPlugin,
        },
        {
            configDeps: ["sourceList"],
            isEnabled: (get) =>
                deserializeCsv(get("sourceList")).includes(UploadSource.LOCAL),
            load: () => localSourcePlugin,
        },
        {
            configDeps: ["sourceList"],
            isEnabled: (get) =>
                Object.values(ExternalUploadSource).some((src) =>
                    deserializeCsv(get("sourceList")).includes(src)
                ),
            load: () => externalSourcesPlugin,
        },
    ]

    // src/solutions/file-uploader/regular/FileUploaderRegular.ts
    var FileUploaderRegular = class extends LitSolutionBlock {
        constructor() {
            super()
            this.headless = false
            this.dynamicButton = false
            this.init$ = {
                ...this.init$,
            }
        }
        static {
            this.lazyPlugins = fileUploaderLazyPlugins
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-file-uploader-regular"]
        }
        initCallback() {
            super.initCallback()
            this.telemetryManager.sendEvent({
                eventType: InternalEventType.INIT_SOLUTION,
            })
        }
        /**
         * Exposes whether the dynamic button is active for non-Lit classes that can't use context
         */
        get isDynamicButtonActive() {
            return this.dynamicButton
        }
        Hl() {
            return b2`
      <uc-dynamic-btn></uc-dynamic-btn>
    `
        }
        Il() {
            return b2`
      <uc-simple-btn></uc-simple-btn>
    `
        }
        Jl() {
            if (this.headless) return null
            if (this.dynamicButton) return this.Hl()
            return this.Il()
        }
        render() {
            return b2`
    ${super.render()}

    ${this.Jl()}

  <uc-modal id="start-from" strokes block-body-scrolling>
    <uc-start-from>
      <uc-drop-area with-icon clickable></uc-drop-area>
      <uc-source-list role="list" wrap></uc-source-list>
      <button type="button" class="uc-secondary-btn" @click=${this.$["*historyBack"]}>${this.l10n("start-from-cancel")}</button>
      <uc-copyright></uc-copyright>
    </uc-start-from>
  </uc-modal>

  <uc-modal id="upload-list" strokes block-body-scrolling>
    <uc-upload-list></uc-upload-list>
  </uc-modal>

  <uc-plugin-activity-renderer mode="modal"></uc-plugin-activity-renderer>
`
        }
    }
    __decorateClass(
        [n5({ type: Boolean })],
        FileUploaderRegular.prototype,
        "headless",
        2
    )
    __decorateClass(
        [n5({ attribute: "dynamic-button", type: Boolean })],
        FileUploaderRegular.prototype,
        "dynamicButton",
        2
    )

    // src/solutions/file-uploader/inline/FileUploaderInline.ts
    var FileUploaderInline = class extends LitSolutionBlock {
        constructor() {
            super()
            this.ni = false
            this.ta = () => {
                if (this.oi) {
                    const historyBack = this.$["*historyBack"]
                    historyBack?.()
                    return
                }
                if (this.pi) {
                    this.$["*currentActivity"] =
                        LitActivityBlock.activities.UPLOAD_LIST
                }
            }
            this.init$ = {
                ...this.init$,
            }
        }
        static {
            this.lazyPlugins = fileUploaderLazyPlugins
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-file-uploader-inline"]
        }
        get oi() {
            const history = this.$["*history"]
            if (!history || history.length <= 1) {
                return false
            }
            return (
                history[history.length - 1] !==
                LitActivityBlock.activities.START_FROM
            )
        }
        get pi() {
            const uploadList = this.$["*uploadList"]
            return (
                this.cfg.showEmptyList ||
                (Array.isArray(uploadList) && uploadList.length > 0)
            )
        }
        df() {
            return (
                this.getCssData("--cfg-init-activity") ||
                LitActivityBlock.activities.START_FROM
            )
        }
        initCallback() {
            super.initCallback()
            this.telemetryManager.sendEvent({
                eventType: InternalEventType.INIT_SOLUTION,
            })
            const initActivity = this.df()
            this.sub("*currentActivity", (val) => {
                if (!val) {
                    this.$["*currentActivity"] = initActivity
                }
            })
            this.sub("*uploadList", (list) => {
                if (
                    Array.isArray(list) &&
                    list.length > 0 &&
                    this.$["*currentActivity"] === initActivity
                ) {
                    this.$["*currentActivity"] =
                        LitActivityBlock.activities.UPLOAD_LIST
                }
            })
            this.sub("*history", () => {
                this.ni = this.oi || this.pi
            })
        }
        render() {
            return b2`
      ${super.render()}
      <uc-start-from>
        <uc-drop-area with-icon clickable></uc-drop-area>
        <uc-source-list role="list" wrap></uc-source-list>
        <button
          type="button"
          class="uc-cancel-btn uc-secondary-btn"
          @click=${this.ta}
          ?hidden=${!this.ni}
        >
          ${this.l10n("start-from-cancel")}
        </button>
        <uc-copyright></uc-copyright>
      </uc-start-from>
      <uc-upload-list></uc-upload-list>
      <uc-plugin-activity-renderer mode="inline"></uc-plugin-activity-renderer>
    `
        }
    }
    __decorateClass(
        [r5()],
        FileUploaderInline.prototype,
        /* @__KEY__ */ "ni",
        2
    )

    // src/solutions/file-uploader/minimal/FileUploaderMinimal.ts
    var ACTIVE_CLASS = "active"
    var EMPTY_CLASS = ""
    var FileUploaderMinimal = class extends LitSolutionBlock {
        constructor() {
            super()
            this.ef = false
            this.dd = false
            this.ed = EMPTY_CLASS
            this.ff = EMPTY_CLASS
            this.Lb = "choose-file"
            this.Gb = (data) => {
                if (data.id === LitActivityBlock.activities.CLOUD_IMG_EDIT) {
                    this.ed = ACTIVE_CLASS
                }
                if (
                    this.$["*currentActivity"] ===
                    LitActivityBlock.activities.UPLOAD_LIST
                ) {
                    this.ed = ACTIVE_CLASS
                    this.dd = true
                }
                const uploadList = this.$["*uploadList"]
                if (!uploadList || uploadList.length <= 0) {
                    this.ff = ACTIVE_CLASS
                }
            }
            this.Hb = (data) => {
                if (data.id === this.$["*currentActivity"]) {
                    this.$["*currentActivity"] =
                        LitActivityBlock.activities.UPLOAD_LIST
                    this.dd = false
                }
                if (data.id === LitActivityBlock.activities.CLOUD_IMG_EDIT) {
                    this.$["*currentActivity"] =
                        LitActivityBlock.activities.UPLOAD_LIST
                }
            }
            this.init$ = {
                ...this.init$,
            }
        }
        static {
            this.lazyPlugins = fileUploaderLazyPlugins
        }
        static {
            this.styleAttrs = [...super.styleAttrs, "uc-file-uploader-minimal"]
        }
        df() {
            return (
                this.getCssData("--cfg-init-activity") ||
                LitActivityBlock.activities.START_FROM
            )
        }
        initCallback() {
            super.initCallback()
            this.telemetryManager.sendEvent({
                eventType: InternalEventType.INIT_SOLUTION,
            })
            const initActivity = this.df()
            this.sub("*currentActivity", (val) => {
                if (val === LitActivityBlock.activities.UPLOAD_LIST) {
                    this.modalManager?.closeAll()
                }
                if (!val) {
                    this.$["*currentActivity"] = initActivity
                }
            })
            this.sub("*uploadList", (list) => {
                if (Array.isArray(list) && list.length > 0) {
                    this.$["*currentActivity"] =
                        LitActivityBlock.activities.UPLOAD_LIST
                    this.ff = EMPTY_CLASS
                } else {
                    this.ed = EMPTY_CLASS
                    this.dd = false
                    this.$["*currentActivity"] = initActivity
                }
            })
            this.subConfigValue("confirmUpload", (confirmUpload) => {
                if (confirmUpload !== false) {
                    this.cfg.confirmUpload = false
                }
            })
            this.subConfigValue("filesViewMode", (mode) => {
                this.setAttribute("mode", mode)
                this.subConfigValue("multiple", (multiple) => {
                    if (mode === "grid") {
                        if (multiple) {
                            this.style.removeProperty("--uc-grid-col")
                        } else {
                            this.style.setProperty("--uc-grid-col", "1")
                        }
                        this.ef = !multiple
                    } else {
                        this.style.removeProperty("--uc-grid-col")
                        this.ef = false
                    }
                })
            })
            this.subConfigValue("multiple", (val) => {
                this.Lb = val ? "choose-files" : "choose-file"
            })
            this.modalManager?.subscribe(ModalEvents.OPEN, this.Gb)
            this.modalManager?.subscribe(ModalEvents.CLOSE, this.Hb)
        }
        disconnectedCallback() {
            super.disconnectedCallback()
            this.modalManager?.unsubscribe(ModalEvents.OPEN, this.Gb)
            this.modalManager?.unsubscribe(ModalEvents.CLOSE, this.Hb)
        }
        render() {
            return b2`
      ${super.render()}
      <uc-start-from ?hidden=${this.dd} class=${this.ff}>
        <uc-drop-area
          ?single=${this.ef}
          initflow
          clickable
          tabindex="0"
        ><span>${this.l10n(this.Lb)}</span></uc-drop-area>
        <uc-copyright></uc-copyright>
      </uc-start-from>
      <uc-upload-list class=${this.ed}></uc-upload-list>

      <uc-modal id="start-from" strokes block-body-scrolling>
        <uc-start-from>
          <uc-drop-area with-icon clickable></uc-drop-area>
          <uc-source-list role="list" wrap></uc-source-list>
          <button
            type="button"
            class="uc-secondary-btn"
            @click=${this.$["*historyBack"]}
          >${this.l10n("start-from-cancel")}</button>
        </uc-start-from>
      </uc-modal>

        <uc-plugin-activity-renderer mode="modal"></uc-plugin-activity-renderer>
    `
        }
    }
    __decorateClass(
        [r5()],
        FileUploaderMinimal.prototype,
        /* @__KEY__ */ "ef",
        2
    )
    __decorateClass(
        [r5()],
        FileUploaderMinimal.prototype,
        /* @__KEY__ */ "dd",
        2
    )
    __decorateClass(
        [r5()],
        FileUploaderMinimal.prototype,
        /* @__KEY__ */ "ed",
        2
    )
    __decorateClass(
        [r5()],
        FileUploaderMinimal.prototype,
        /* @__KEY__ */ "ff",
        2
    )
    __decorateClass(
        [r5()],
        FileUploaderMinimal.prototype,
        /* @__KEY__ */ "Lb",
        2
    )
    /*! For license information please see framer.js.LEGAL.txt */

    return {
        ActivityBlock: LitActivityBlock,
        ActivityHeader,
        BaseComponent,
        Block: LitBlock,
        BtnUi,
        CloudImageEditor,
        CloudImageEditorActivity,
        CloudImageEditorBlock,
        Config,
        Copyright,
        CropFrame,
        Data: PubSub,
        DropArea,
        DropDown,
        DynamicBtn,
        EditorAspectRatioButtonControl,
        EditorCropButtonControl,
        EditorFilterControl,
        EditorFreeformButtonControl,
        EditorImageCropper,
        EditorImageFader,
        EditorOperationControl,
        EditorScroller,
        EditorSlider,
        EditorToolbar,
        ExternalSource,
        ExternalUploadSource,
        FileActionButton,
        FileItem,
        FileUploaderInline,
        FileUploaderMinimal,
        FileUploaderRegular,
        FormInput,
        Icon,
        Img,
        LineLoaderUi,
        Modal,
        ModalEvents,
        NoWrapModeDynamicBtn,
        PACKAGE_NAME,
        PACKAGE_VERSION,
        PluginActivityHost,
        PluginActivityRenderer,
        PresenceToggle,
        PrimaryAction,
        ProgressBar,
        ProgressBarCommon,
        Select,
        SimpleBtn,
        SliderUi,
        SolutionBlock: LitSolutionBlock,
        SourceBtn,
        SourceList,
        Spinner,
        StartFrom,
        Thumb,
        UID,
        UploadCtxProvider,
        UploadList,
        UploadSource,
        UploaderBlock: LitUploaderBlock,
        defineComponents,
        defineLocale,
        toKebabCase,
    }
})

const UC_BUNDLE_CSS = Promise.resolve().then(() => ({
    default: String(`
    @layer uc, uc.base, uc.shared, uc.components, uc.rules, uc.solutions, uc.post-reset, uc.base, uc.base, uc.shared, uc.rules, uc.post-reset;

/* src/blocks/Icon/icon.css */
@layer uc.shared {
  uc-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--uc-button-size);
    height: var(--uc-button-size);
  }
  uc-icon svg {
    width: calc(var(--uc-button-size) / 2);
    height: calc(var(--uc-button-size) / 2);
    overflow: visible;
  }
}

/* src/blocks/Modal/modal.css */
@layer uc.shared {
  @supports selector(dialog::backdrop) {
    :where([uc-modal]) > dialog::backdrop {
      background-color: oklch(0% 0 0 / 0.1);
    }
    :where([uc-modal])[strokes] > dialog::backdrop {
      background-image: var(--modal-backdrop-background-image);
    }
  }
  :where([uc-modal]) > dialog[open] {
    transform: translateY(0px);
    visibility: visible;
    opacity: 1;
  }
  :where([uc-modal]) > dialog:not([open]) {
    transform: translateY(20px);
    visibility: hidden;
    opacity: 0;
  }
  :where([uc-modal]) > dialog {
    display: flex;
    flex-direction: column;
    width: min(var(--uc-dialog-width), 100%);
    max-width: min(calc(100% - var(--uc-padding) * 2), var(--uc-dialog-max-width));
    min-height: var(--uc-button-size);
    max-height: min(calc(100% - var(--uc-padding) * 2), var(--uc-dialog-max-height));
    margin: auto;
    padding: 0;
    overflow: hidden;
    background-color: var(--uc-background);
    border: 0;
    border-radius: calc(var(--uc-radius) * 1.75);
    box-shadow: var(--uc-dialog-shadow);
    transition: transform 0.4s ease, opacity 0.4s ease;
  }
  :where(.uc-contrast) :where([uc-modal]) > dialog {
    outline: 1px solid var(--uc-border);
  }
}

/* src/blocks/Copyright/copyright.css */
@layer uc.components {
  uc-copyright {
    display: flex;
    width: 100%;
    justify-content: center;
  }
  uc-copyright .uc-credits {
    all: unset;
    position: absolute;
    bottom: 12px;
    background-color: var(--uc-background);
    padding: 2px 5px;
    border-radius: 6px;
    color: var(--uc-muted-foreground);
    font-weight: normal;
    font-size: 12px;
    opacity: 0.9;
    cursor: pointer;
    transition: opacity var(--uc-transition), background-color var(--uc-transition);
  }
  uc-copyright .uc-credits:focus-visible {
    outline: 1px auto Highlight;
    outline: 1px auto -webkit-focus-ring-color;
  }
  uc-copyright .uc-credits:hover {
    opacity: 1;
    background-color: var(--uc-muted);
  }
}

/* src/blocks/ProgressBar/progress-bar.css */
@layer uc.shared {
  uc-progress-bar {
    --visible-opacity: 1;
    --l-progress-value: 0;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    transition: opacity 0.3s;
    opacity: 1;
  }
  uc-progress-bar.uc-progress-bar--hidden {
    opacity: 0;
  }
  uc-progress-bar .uc-progress {
    position: absolute;
    width: calc(var(--l-progress-value) * 1%);
    height: 100%;
    background-color: var(--uc-primary);
    transform: translateX(0);
    opacity: var(--visible-opacity);
    transition: width 0.6s, opacity 0.3s;
  }
  uc-progress-bar .uc-progress--hidden {
    opacity: 0;
    transition: opacity 0.3s;
  }
  uc-progress-bar .uc-fake-progress {
    --l-fake-progress-width: 30;
    position: absolute;
    width: calc(var(--l-fake-progress-width) * 1%);
    height: 100%;
    background-color: var(--uc-primary);
    animation: fake-progress-animation 1s ease-in-out infinite;
    opacity: var(--visible-opacity);
    transition: opacity 0.3s;
    z-index: 1;
  }
  uc-progress-bar .uc-fake-progress--hidden {
    opacity: 0;
    animation: none;
  }
  @keyframes fake-progress-animation {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(calc(100 / var(--l-fake-progress-width) * 100 * 1%));
    }
  }
}

/* src/blocks/ProgressBarCommon/progress-bar-common.css */
@layer uc.shared {
  uc-progress-bar-common {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10000;
    display: block;
    height: 10px;
    background-color: var(--uc-background);
    transition: opacity 0.3s;
  }
  uc-progress-bar-common:not([active]) {
    opacity: 0;
    pointer-events: none;
  }
}

/* src/blocks/Select/select.css */
@layer uc.shared {
  uc-select {
    display: inline-flex;
  }
  uc-select select {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--uc-button-size);
    padding: 0 14px;
    font-size: 1em;
    font-family: inherit;
    white-space: nowrap;
    border: none;
    border-radius: var(--uc-radius);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--uc-transition);
    color: var(--uc-secondary-foreground);
    background-color: var(--uc-secondary);
  }
}

/* src/blocks/SourceBtn/source-btn.css */
@layer uc.components {
  uc-source-btn > button {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
    padding: 2px var(--uc-padding);
    color: var(--uc-foreground);
    border-radius: var(--uc-radius);
    cursor: pointer;
    transition: background-color var(--uc-transition), color var(--uc-transition);
    user-select: none;
    width: 100%;
    background-color: unset;
    height: unset;
  }
  uc-source-btn:last-child > button {
    margin-bottom: 0;
  }
  uc-source-btn > button:hover {
    background-color: var(--uc-primary-transparent);
  }
  :where(.uc-contrast) uc-source-btn > button:hover {
    background-color: var(--uc-secondary);
    color: var(--uc-foreground);
  }
  uc-source-btn uc-icon {
    display: inline-flex;
    flex-grow: 1;
    justify-content: center;
    min-width: var(--uc-button-size);
    margin-right: var(--uc-padding);
    opacity: 0.8;
  }
  :where(.uc-contrast) uc-source-btn uc-icon {
    opacity: 1;
  }
  uc-source-btn .uc-txt {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: var(--uc-button-size);
    padding: 0;
    white-space: nowrap;
    border: none;
  }
}

/* src/blocks/Spinner/spinner.css */
@layer uc.shared {
  @keyframes uc-spinner-keyframes {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .uc-spinner {
    width: 1em;
    height: 1em;
    border: solid 2px transparent;
    border-top-color: currentColor;
    border-left-color: currentColor;
    border-radius: 50%;
    animation: uc-spinner-keyframes 400ms linear infinite;
  }
}

/* src/blocks/Thumb/thumb.css */
@layer uc.shared {
  uc-thumb {
    width: 100%;
    height: 100%;
  }
  .uc-thumb {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
  .uc-thumb__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
}

/* src/blocks/ActivityHeader/activity-header.css */
@layer uc.shared {
  :is(uc-activity-header, .uc-ui-activity-header) {
    display: flex;
    justify-content: space-between;
    gap: var(--uc-padding);
    padding: var(--uc-padding);
    color: var(--uc-foreground);
    font-weight: 500;
    font-size: 1em;
  }
  :is(uc-activity-header, .uc-ui-activity-header) > * {
    display: flex;
    align-items: center;
  }
  :is(uc-activity-header, .uc-ui-activity-header) > div > uc-icon {
    width: auto;
  }
  :is(uc-activity-header, .uc-ui-activity-header) > div {
    gap: var(--uc-padding);
  }
}

/* src/blocks/StartFrom/start-from.css */
@layer uc.components {
  uc-start-from {
    display: block;
    overflow-y: auto;
  }
  uc-start-from .uc-content {
    display: grid;
    grid-auto-flow: row;
    gap: calc(var(--uc-padding) * 2);
    width: 100%;
    height: 100%;
    padding: calc(var(--uc-padding) * 2);
    background-color: var(--uc-background);
  }
  [uc-modal] > dialog:has(uc-start-from[active]) {
    width: var(--uc-dialog-width);
  }
  [uc-modal] uc-start-from uc-drop-area {
    border-radius: var(--uc-radius);
  }
  @media only screen and (max-width: 430px) {
    [uc-modal] uc-start-from uc-drop-area {
      display: none;
    }
  }
}

/* src/blocks/UploadList/upload-list.css */
@layer uc.components {
  uc-upload-list {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: max-content;
    overflow: hidden;
    background-color: var(--uc-background);
    transition: opacity var(--uc-transition);
  }
  uc-upload-list .uc-no-files {
    height: 32px;
    padding: 20px;
  }
  uc-upload-list .uc-files {
    display: block;
    flex: 1;
    min-height: 32px;
    padding: 0 var(--uc-padding);
    overflow: auto;
  }
  uc-upload-list .uc-files-wrapper {
    display: contents;
  }
  uc-upload-list .uc-toolbar {
    display: flex;
    gap: 4px;
    justify-content: space-between;
    padding: var(--uc-padding);
    background-color: var(--uc-background);
  }
  uc-upload-list .uc-toolbar-spacer {
    flex: 1;
  }
  uc-upload-list uc-drop-area {
    position: absolute;
    top: 0;
    left: 0;
    width: calc(100% - var(--uc-padding) * 2);
    height: calc(100% - var(--uc-padding) * 2);
    margin: var(--uc-padding);
    border-radius: var(--uc-radius);
  }
  uc-upload-list uc-activity-header > .uc-header-text {
    padding: 0 var(--uc-padding);
  }
  uc-upload-list .uc-common-error {
    border-radius: var(--uc-radius);
    color: var(--uc-destructive-foreground);
    background-color: var(--uc-destructive);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--uc-padding);
    margin: 4px var(--uc-padding) 0 var(--uc-padding);
    font-size: 0.925em;
  }
  uc-upload-list .uc-add-more-btn uc-icon {
    display: none;
  }
  uc-upload-list[mode=grid] .uc-files {
    display: flex;
    flex-wrap: wrap;
    gap: var(--uc-grid-gap);
  }
  uc-upload-list .uc-files .uc-add-more-btn,
  uc-upload-list[mode=grid] uc-file-item {
    flex: 0 0 calc((100% - (var(--uc-grid-gap) * (var(--uc-grid-col) - 1))) / var(--uc-grid-col));
    max-width: calc((100% - (var(--uc-grid-gap) * (var(--uc-grid-col) - 1))) / var(--uc-grid-col));
    height: var(--uc-grid-preview-image-height);
    aspect-ratio: var(--uc-grid-aspect-ratio);
  }
  uc-upload-list .uc-files .uc-add-more-btn {
    display: none;
  }
}

/* src/blocks/FileItem/file-item.css */
@layer uc.components {
  uc-file-item {
    --uc-file-item-gap: 4px;
    --uc-file-item-height: calc(var(--uc-preview-size) + var(--uc-padding) * 2 + var(--uc-file-item-gap));
    display: block;
    overflow: hidden;
    min-height: var(--uc-file-item-height);
  }
  uc-file-item:last-of-type {
    --uc-file-item-gap: 0;
  }
  uc-file-item > .uc-inner {
    position: relative;
    display: grid;
    grid-template-columns: var(--uc-preview-size) 1fr max-content;
    gap: 2px;
    align-items: center;
    margin-bottom: var(--uc-file-item-gap);
    padding: var(--uc-padding);
    overflow: hidden;
    font-size: 0.925em;
    background-color: var(--uc-muted);
    border-radius: var(--uc-radius);
    transition: background-color var(--uc-transition);
  }
  uc-file-item > .uc-inner[data-focused] {
    background-color: transparent;
  }
  uc-file-item > .uc-inner[data-uploading] .uc-edit-btn {
    display: none;
  }
  uc-file-item > :where(.uc-inner[data-failed], .uc-inner[data-limit-overflow]) {
    background-color: var(--uc-destructive);
  }
  uc-file-item .uc-thumb {
    position: relative;
    display: inline-flex;
    width: var(--uc-preview-size);
    height: var(--uc-preview-size);
    background-color: var(--uc-secondary);
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: var(--uc-radius);
  }
  uc-file-item .uc-file-name-wrapper {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    max-width: 100%;
    padding-right: var(--uc-padding);
    padding-left: var(--uc-padding);
    overflow: hidden;
    color: var(--uc-muted-foreground);
  }
  uc-file-item .uc-file-name {
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  uc-file-item .uc-file-error {
    display: none;
    color: var(--uc-destructive-foreground);
    font-size: 0.85em;
    z-index: 2;
  }
  uc-file-item button.uc-remove-btn,
  uc-file-item button.uc-edit-btn {
    color: var(--uc-muted-foreground);
  }
  uc-file-item button svg {
    pointer-events: none;
  }
  uc-file-item .uc-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 14px;
    height: 14px;
    color: var(--uc-background);
    background-color: var(--uc-foreground);
    border-radius: 50%;
    transform: scale(0.3);
    opacity: 0;
    transition: opacity var(--uc-transition), transform var(--uc-transition);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  uc-file-item > .uc-inner:where([data-failed], [data-limit-overflow], [data-finished]) .uc-badge {
    transform: scale(1);
    opacity: 1;
  }
  uc-file-item > .uc-inner:where([data-failed], [data-limit-overflow]) .uc-badge {
    background-color: var(--uc-destructive-foreground);
  }
  uc-file-item > .uc-inner:where([data-failed], [data-limit-overflow]) .uc-file-error {
    display: block;
  }
  uc-file-item .uc-badge uc-icon,
  uc-file-item .uc-badge uc-icon svg {
    width: 100%;
    height: 100%;
  }
  uc-file-item .uc-file-actions {
    display: flex;
    gap: 2px;
    align-items: center;
    justify-content: center;
  }
  uc-file-item[mode=grid] {
    overflow: visible;
    min-height: initial;
  }
  uc-file-item[mode=grid] .uc-inner {
    height: 100%;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr max-content;
    padding: 0;
    background-color: transparent;
    margin-bottom: 0;
    border-radius: 0;
  }
  uc-file-item[mode=grid] .uc-inner[data-failed] .uc-badge {
    display: none;
  }
  uc-file-item[mode=grid] .uc-thumb {
    width: 100%;
    height: 100%;
  }
  uc-file-item[mode=grid] .uc-badge {
    right: var(--uc-padding);
    bottom: var(--uc-padding);
  }
  uc-file-item[mode=grid] .uc-file-name-wrapper {
    padding: 0;
  }
  uc-file-item[mode=grid] .uc-file-name:not([hidden]) + .uc-file-error {
    bottom: calc(var(--uc-padding) + var(--uc-font-size));
  }
  uc-file-item[mode=grid] .uc-file-error {
    position: absolute;
    background-color: var(--uc-destructive-foreground);
    border-radius: var(--uc-radius);
    color: var(--uc-background);
    bottom: var(--uc-padding);
    left: var(--uc-padding);
    right: var(--uc-padding);
    padding: calc(var(--uc-padding) / 2) var(--uc-padding);
  }
  uc-file-item[mode=grid] .uc-file-hint {
    position: absolute;
    background-color: var(--uc-background);
    border-radius: var(--uc-radius);
    color: var(--uc-foreground);
    bottom: calc(var(--uc-padding) * 2);
    left: var(--uc-padding);
    right: var(--uc-padding);
    padding: calc(var(--uc-padding) / 2) var(--uc-padding);
  }
  uc-file-item[mode=grid] .uc-file-actions {
    position: absolute;
    top: var(--uc-padding);
    right: var(--uc-padding);
  }
  uc-file-item[mode=grid] button {
    background-color: var(--uc-background);
  }
  uc-file-item[mode=grid] button:hover {
    background-color: var(--uc-muted);
  }
}

/* src/blocks/FileItem/file-action-button.css */
@layer uc.shared {
  :where([uc-file-action-button]) {
    position: relative;
  }
  :where([uc-file-action-button]) button {
    position: relative;
  }
  :where([uc-file-action-button]) .uc-icon-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
  }
  :where([uc-file-action-button]) .uc-icon-wrap uc-icon {
    grid-area: 1 / 1;
    transition: opacity var(--uc-transition), transform var(--uc-transition);
  }
  :where([uc-file-action-button]) uc-icon[name=close] {
    opacity: 0;
    transform: scale(1);
  }
  :where([uc-file-action-button]) uc-icon[name=remove-file] {
    opacity: 1;
    transform: scale(1);
  }
  :where([uc-file-action-button]) button:is(.uc-uploading, .uc-hide-remove) uc-icon[name=close] {
    opacity: 0.5;
  }
  :where([uc-file-action-button]) button:is(.uc-uploading, .uc-hide-remove):hover uc-icon[name=close] {
    opacity: 1;
  }
  :where([uc-file-action-button]) button:is(.uc-uploading, .uc-hide-remove) uc-icon[name=remove-file] {
    opacity: 0;
    transform: scale(0.95);
  }
  :where([uc-file-action-button]) .uc-preloader {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 24px;
    height: 24px;
    margin: -12px 0 0 -12px;
    color: var(--uc-primary);
    opacity: 0;
    pointer-events: none;
  }
  :where([uc-file-action-button]) .uc-preloader svg {
    width: 24px;
    height: 24px;
  }
  :where([uc-file-action-button]) button.uc-uploading .uc-preloader {
    opacity: 1;
  }
}

/* src/blocks/DropArea/drop-area.css */
@layer uc.components {
  :where([uc-drop-area]) {
    padding: 2px;
    overflow: hidden;
    border: 1px dashed var(--uc-border);
    border-radius: calc(var(--uc-radius) * 1.75);
    transition: border var(--uc-transition), border-radius var(--uc-transition);
  }
  :where([uc-drop-area]),
  :where([uc-drop-area]) .uc-content-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  :where([uc-drop-area]) .uc-text {
    position: relative;
    margin: var(--uc-padding);
    color: var(--uc-muted-foreground);
    transition: color var(--uc-transition);
  }
  :where([uc-drop-area])[ghost][drag-state=inactive] {
    display: none;
  }
  :where([uc-drop-area])[ghost]:not([fullscreen]):is([drag-state=active], [drag-state=near], [drag-state=over]) {
    background: var(--uc-background);
  }
  :where([uc-drop-area]):is([drag-state=active], [drag-state=near], [drag-state=over], :hover) {
    background: var(--uc-primary-transparent);
    border-color: var(--uc-primary-transparent);
  }
  :where(.uc-contrast) :where([uc-drop-area]):is([drag-state=active], [drag-state=near], [drag-state=over], :hover) {
    color: var(--uc-foreground);
    background: transparent;
    border-color: var(--uc-foreground);
    border-width: 2px;
    border-style: solid;
  }
  :where([uc-drop-area]):is([drag-state=active], [drag-state=near]) {
    opacity: 1;
  }
  :where([uc-drop-area])[drag-state=over] {
    border-color: var(--uc-primary);
    opacity: 1;
  }
  :where([uc-drop-area])[with-icon] {
    min-height: 180px;
  }
  :where([uc-drop-area])[with-icon] .uc-content-wrapper {
    display: flex;
    flex-direction: column;
  }
  :where([uc-drop-area])[with-icon] .uc-text {
    color: var(--uc-foreground);
    font-weight: 500;
    font-size: 1.1em;
  }
  :where([uc-drop-area])[with-icon] .uc-icon-container {
    position: relative;
    width: 64px;
    height: 64px;
    margin: var(--uc-padding);
    overflow: hidden;
    color: var(--uc-foreground);
    background-color: var(--uc-muted);
    border-radius: 50%;
    transition: color var(--uc-transition), background-color var(--uc-transition);
  }
  :where([uc-drop-area])[with-icon] uc-icon {
    position: absolute;
    width: 32px;
    height: 32px;
    top: calc(50% - 16px);
    left: calc(50% - 16px);
    transition: transform var(--uc-transition);
  }
  :where([uc-drop-area])[with-icon] uc-icon:last-child {
    transform: translateY(48px);
  }
  :where(.uc-contrast) :where([uc-drop-area])[with-icon]:hover .uc-icon-container,
  :where(.uc-contrast) :where([uc-drop-area])[with-icon]:hover .uc-text {
    color: var(--uc-foreground);
  }
  :where([uc-drop-area])[with-icon]:hover .uc-icon-container {
    background-color: var(--uc-primary-transparent);
  }
  :where(.uc-contrast) :where([uc-drop-area])[with-icon]:hover .uc-icon-container {
    background-color: var(--uc-muted);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper:is([drag-state=active], [drag-state=near], [drag-state=over]) .uc-icon-container {
    color: var(--uc-primary-foreground);
    background-color: var(--uc-primary);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper:is([drag-state=active], [drag-state=near], [drag-state=over]) .uc-text {
    color: var(--uc-foreground);
  }
  :where(.uc-contrast) :where([uc-drop-area])[with-icon] > .uc-content-wrapper:is([drag-state=active], [drag-state=near], [drag-state=over]) .uc-text {
    color: var(--uc-foreground);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper:is([drag-state=active], [drag-state=near], [drag-state=over]) uc-icon:first-child {
    transform: translateY(-48px);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper:is([drag-state=active], [drag-state=near], [drag-state=over]) uc-icon:last-child {
    transform: translateY(0);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper[drag-state=near] uc-icon:last-child {
    transform: scale(1.3);
  }
  :where([uc-drop-area])[with-icon] > .uc-content-wrapper[drag-state=over] uc-icon:last-child {
    transform: scale(1.5);
  }
  :where([uc-drop-area])[fullscreen] {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(100vw - var(--uc-padding) * 2);
    height: calc(100vh - var(--uc-padding) * 2);
    margin: var(--uc-padding);
  }
  :where([uc-drop-area])[fullscreen] .uc-content-wrapper {
    width: 100%;
    max-width: calc(var(--uc-dialog-width) * 0.8);
    height: 180px;
    color: var(--uc-foreground);
    background-color: var(--uc-background);
    border-radius: calc(var(--uc-radius) * 1.75);
    box-shadow: var(--uc-dialog-shadow);
    transition:
      color var(--uc-transition),
      background-color var(--uc-transition),
      box-shadow var(--uc-transition),
      border-radius var(--uc-transition),
      transform var(--uc-transition);
  }
  :where([uc-drop-area])[with-icon][fullscreen][drag-state=active] > .uc-content-wrapper,
  :where([uc-drop-area])[with-icon][fullscreen][drag-state=near] > .uc-content-wrapper {
    transform: translateY(10px);
    opacity: 0;
  }
  :where([uc-drop-area])[with-icon][fullscreen][drag-state=over] > .uc-content-wrapper {
    transform: translateY(0px);
    opacity: 1;
  }
  :is(:where([uc-drop-area])[with-icon][fullscreen]) > .uc-content-wrapper uc-icon:first-child {
    transform: translateY(-48px);
  }
  :where([uc-drop-area])[clickable] {
    cursor: pointer;
  }
}

/* src/blocks/Config/config.css */
@layer uc.components {
  uc-config {
    display: none;
  }
}

/* src/blocks/SimpleBtn/simple-btn.css */
@layer uc.components {
  :where([uc-simple-btn]) {
    position: relative;
    display: inline-flex;
  }
  :where([uc-simple-btn]) button {
    height: auto;
    gap: 0.5em;
    padding: var(--uc-simple-btn-padding);
    background-color: var(--uc-simple-btn);
    color: var(--uc-simple-btn-foreground);
    font-size: var(--uc-simple-btn-font-size);
    font-family: var(--uc-simple-btn-font-family);
  }
  :where([uc-simple-btn]) button uc-icon {
    width: auto;
    height: auto;
  }
  :where([uc-simple-btn]) button uc-icon svg {
    width: 0.9em;
    height: 0.9em;
  }
  :where([uc-simple-btn]) button:hover {
    background-color: var(--uc-simple-btn-hover);
  }
  :where([uc-simple-btn]) > uc-drop-area {
    display: contents;
  }
  :where([uc-simple-btn]) .uc-visual-drop-area {
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: var(--uc-simple-btn-padding);
    background-color: transparent;
    color: transparent;
    font-size: var(--uc-simple-btn-font-size);
    border: 1px dashed var(--uc-simple-btn-foreground);
    border-radius: inherit;
    opacity: 0;
    transition: opacity var(--uc-transition);
  }
  :where([uc-simple-btn]) > uc-drop-area[drag-state=active] .uc-visual-drop-area {
    opacity: 1;
  }
  :where([uc-simple-btn]) > uc-drop-area[drag-state=inactive] .uc-visual-drop-area {
    opacity: 0;
  }
  :where([uc-simple-btn]) > uc-drop-area[drag-state=near] .uc-visual-drop-area {
    opacity: 1;
  }
  :where([uc-simple-btn]) > uc-drop-area[drag-state=over] .uc-visual-drop-area {
    opacity: 1;
  }
}

/* src/blocks/DynamicBtn/dynamic-btn.css */
@layer uc.components {
  :where([uc-dynamic-btn]) {
    position: relative;
    display: inline-flex;
  }
  :where([uc-dynamic-btn]) > uc-drop-area {
    display: contents;
  }
  :where([uc-dynamic-btn] .uc-dynamic-btn-inner) {
    display: flex;
    gap: 3px;
    background-color: var(--uc-simple-btn);
    border-radius: calc(var(--uc-radius) * 1.25);
    padding: 2px;
    isolation: isolate;
  }
  :where([uc-dynamic-btn] .uc-dynamic-btn-inner.uc-failed) {
    background-color: var(--uc-destructive);
  }
  :where([uc-dynamic-btn] .uc-dynamic-btn-inner.uc-failed) button {
    color: var(--uc-destructive-foreground);
    &:hover {
      background-color: var(--uc-destructive);
    }
  }
  :where([uc-dynamic-btn]) .uc-visual-drop-area {
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: var(--uc-simple-btn-padding);
    background-color: var(--uc-background);
    color: var(--uc-primary);
    font-size: var(--uc-simple-btn-font-size);
    border: 1px dashed var(--uc-simple-btn-foreground);
    border-radius: inherit;
    opacity: 0;
    transition: opacity var(--uc-transition);
    pointer-events: none;
  }
  :where([uc-dynamic-btn]) > uc-drop-area[drag-state=active] .uc-visual-drop-area {
    opacity: 1;
  }
  :where([uc-dynamic-btn]) > uc-drop-area[drag-state=inactive] .uc-visual-drop-area {
    opacity: 0;
  }
  :where([uc-dynamic-btn]) > uc-drop-area[drag-state=near] .uc-visual-drop-area {
    opacity: 1;
  }
  :where([uc-dynamic-btn]) > uc-drop-area[drag-state=over] .uc-visual-drop-area {
    opacity: 1;
  }
  :where([uc-dynamic-btn]) .uc-source-list {
    display: flex;
    gap: 3px;
  }
  :where([uc-dynamic-btn]) uc-source-btn button {
    margin-bottom: 0;
    padding: 0 var(--uc-padding);
  }
  :where([uc-dynamic-btn]) uc-source-btn button:hover {
    background-color: var(--uc-secondary);
  }
  :where([uc-dynamic-btn]) button::before {
    position: absolute;
    content: "";
    right: -2px;
    width: 1px;
    height: 18px;
    bottom: 0;
    top: 0;
    margin: auto;
    background-color: var(--uc-secondary);
  }
  :where([uc-dynamic-btn]:not(:has([uc-no-wrap-mode-dynamic-btn], [uc-drop-down], [uc-file-action-button])) [uc-primary-action], [uc-file-action-button], [uc-drop-down], [uc-no-wrap-mode-dynamic-btn] > uc-source-btn:last-child) button::before {
    content: none;
  }
  :where([uc-dynamic-btn] [uc-drop-down]) .uc-dropdown-content uc-source-btn uc-icon {
    margin-right: 0;
    margin-left: calc(var(--uc-padding) * -0.5);
  }
  :where([uc-drop-down]) .uc-dropdown-menu {
    display: flex;
    flex-direction: column;
    gap: calc(var(--uc-padding) / 2);
  }
}

/* src/blocks/DynamicBtn/dynamic-btn-mode.css */
@layer uc.components {
  :where([uc-no-wrap-mode-dynamic-btn]) {
    display: flex;
    gap: 3px;
  }
  :where([uc-no-wrap-mode-dynamic-btn]) > uc-source-btn {
    position: relative;
  }
  :where([uc-no-wrap-mode-dynamic-btn]) > uc-source-btn button {
    padding: 0;
  }
  :where([uc-no-wrap-mode-dynamic-btn]) > uc-source-btn button uc-icon {
    margin-right: 0;
  }
}

/* src/blocks/DynamicBtn/primary-action.css */
@layer uc.components {
  :where([uc-primary-action]) {
    position: relative;
  }
  :where([uc-primary-action] button) {
    background-color: transparent;
    color: var(--uc-foreground);
  }
  :where([uc-primary-action] button:hover) {
    background-color: var(--uc-secondary);
  }
  :where([uc-primary-action] button uc-icon) {
    margin-left: calc(var(--uc-padding) * -1);
  }
  :where([uc-primary-action] uc-thumb) {
    margin-left: calc(var(--uc-padding) * -1);
    margin-right: var(--uc-padding);
    width: 24px;
    height: 24px;
    border-radius: 6px;
    overflow: hidden;
  }
}

/* src/blocks/DropDown/drop-down.css */
@layer uc.shared {
  :where([uc-drop-down]) {
    anchor-scope: --menu-button;
  }
  :where([uc-drop-down]) .uc-dropdown-btn {
    position: relative;
    anchor-name: --menu-button;
  }
  :where([uc-drop-down]) .uc-dropdown-content {
    position-anchor: --menu-button;
    position-area: bottom span-left;
    margin-block-start: 0.25rem;
    padding: calc(var(--uc-padding) / 2);
    border: none;
    border-radius: 12px;
    box-shadow: var(--uc-dialog-shadow);
    background-color: var(--uc-background);
    margin: 0;
  }
  :where([uc-drop-down]) [popover]:popover-open {
    opacity: 1;
    transform: translateY(0);
    transition: transform 0.4s ease, opacity 0.4s ease;
    @starting-style {
      opacity: 0;
      transform: translateY(8px);
    }
  }
}

/* src/blocks/PluginActivityRenderer/uc-plugin-activity-host.css */
@layer uc.components {
  uc-plugin-activity-host {
    display: contents;
  }
}
@layer uc.solutions;

/* src/blocks/CloudImageEditorActivity/cloud-image-editor-activity.css */
@layer uc.components {
  uc-cloud-image-editor-activity {
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--uc-background);
  }
  [uc-modal] > dialog:has([activity=cloud-image-edit][active]) {
    width: 100%;
    height: 100%;
  }
}

/* src/blocks/ExternalSource/external-source.css */
@layer uc.components {
  uc-external-source {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--uc-background);
    overflow: hidden;
    position: relative;
  }
  [uc-modal] > dialog:has([activity=external][active]) {
    width: 100%;
    height: 100%;
  }
  uc-external-source > .uc-content {
    position: relative;
    display: grid;
    flex: 1;
    grid-template-rows: 1fr min-content;
  }
  uc-external-source iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
  uc-external-source .uc-iframe-wrapper {
    overflow: hidden;
  }
  uc-external-source .uc-toolbar {
    display: flex;
    width: 100%;
    gap: var(--uc-padding);
    align-items: center;
    justify-content: space-between;
    padding: var(--uc-padding);
    border-top: 1px solid var(--uc-border);
  }
  uc-external-source .uc-back-btn {
    padding-left: 0;
  }
  uc-external-source .uc-selection-status-box {
    color: var(--uc-foreground);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  uc-external-source .uc-selection-status-box button {
    color: var(--uc-primary);
    height: auto;
    padding: 0;
    background: none;
  }
  uc-external-source .uc-selection-status-box button:hover {
    text-decoration: underline;
  }
  uc-external-source uc-activity-header {
    position: absolute;
    width: 100%;
    justify-content: flex-end;
    z-index: 1;
    left: 0;
    top: 0;
    right: 0;
    pointer-events: none;
  }
  uc-external-source uc-activity-header .uc-close-btn {
    pointer-events: auto;
  }
  uc-external-source .uc-done-btn > span.uc-hidden {
    visibility: hidden;
    pointer-events: none;
  }
  uc-external-source .uc-done-btn > uc-spinner {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* src/solutions/file-uploader/regular/index.css */

/* src/blocks/CloudImageEditor/src/css/common.css */
@layer uc.solutions {
  [uc-cloud-image-editor] {
    --color-primary-accent: var(--uc-primary);
    --color-text-base: var(--uc-foreground);
    --color-text-accent-contrast: var(--uc-background);
    --color-fill-contrast: var(--uc-background);
    --color-modal-backdrop: oklch(0% 0 0 / 0.1);
    --color-image-background: var(--uc-muted);
    --color-focus-ring: var(--color-primary-accent);
    --color-crop-guides: var(--uc-foreground);
    --font-size-ui: var(--uc-font-size);
    --size-touch-area: var(--uc-button-size);
    --size-panel-heading: calc(var(--uc-button-size) + var(--uc-padding) * 2);
    --size-ui-min-width: 130px;
    --size-line-width: 1px;
    --size-modal-width: 650px;
    --size-icon: calc(var(--uc-button-size) / 2);
    --border-radius-editor: var(--uc-radius);
    --border-radius-thumb: var(--uc-radius);
    --border-radius-ui: var(--uc-radius);
    --border-radius-base: var(--uc-radius);
    --cldtr-gap-min: 5px;
    --cldtr-gap-mid-1: 10px;
    --cldtr-gap-mid-2: 15px;
    --cldtr-gap-max: 20px;
    --transition-duration-2: var(--transition-duration-all, 0.2s);
    --transition-duration-3: var(--transition-duration-all, 0.3s);
    --transition-duration-4: var(--transition-duration-all, 0.4s);
    --transition-duration-5: var(--transition-duration-all, 0.5s);
    --modal-header-opacity: 1;
    --modal-header-height: var(--size-panel-heading);
    --modal-toolbar-height: var(--size-panel-heading);
    --transparent-pixel: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=);
    display: block;
    width: 100%;
    height: 100%;
    max-height: 100%;
  }
  [uc-cloud-image-editor] :is([can-handle-paste]:hover, [can-handle-paste]:focus) {
    --can-handle-paste: "true";
  }
  [uc-cloud-image-editor] :is([tabindex]:focus-visible, [tabindex]:hover, [with-effects]:focus-visible, [with-effects]:hover) {
    --filter-effect: var(--hover-filter) !important;
    --opacity-effect: var(--hover-opacity) !important;
    --color-effect: var(--hover-color-rgb) !important;
    --background-effect: var(--hover-background) !important;
  }
  [uc-cloud-image-editor] :is([tabindex]:active, [with-effects]:active) {
    --filter-effect: var(--down-filter) !important;
    --opacity-effect: var(--down-opacity) !important;
    --color-effect: var(--down-color-rgb) !important;
    --background-effect: var(--down-background) !important;
  }
  [uc-cloud-image-editor] :is([tabindex][active], [with-effects][active]) {
    --filter-effect: var(--active-filter) !important;
    --opacity-effect: var(--active-opacity) !important;
    --color-effect: var(--active-color-rgb) !important;
    --background-effect: var(--active-background) !important;
  }
  [uc-cloud-image-editor] [hidden-scrollbar]::-webkit-scrollbar {
    display: none;
  }
  [uc-cloud-image-editor] [hidden-scrollbar] {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  [uc-cloud-image-editor].uc-editor_ON {
    --modal-header-opacity: 0;
    --modal-header-height: 0px;
    --modal-toolbar-height: calc(var(--size-panel-heading) * 2);
  }
  [uc-cloud-image-editor].uc-editor_OFF {
    --modal-header-opacity: 1;
    --modal-header-height: var(--size-panel-heading);
    --modal-toolbar-height: var(--size-panel-heading);
  }
  [uc-cloud-image-editor] > .uc-wrapper {
    --l-min-img-height: var(--modal-toolbar-height);
    --l-max-img-height: 100%;
    --l-edit-button-width: 120px;
    --l-toolbar-horizontal-padding: var(--cldtr-gap-mid-1);
    position: relative;
    display: grid;
    grid-template-rows: minmax(var(--l-min-img-height), var(--l-max-img-height)) minmax(var(--modal-toolbar-height), auto);
    height: 100%;
    overflow: hidden;
    overflow-y: auto;
  }
  @media only screen and (max-width: 800px) {
    [uc-cloud-image-editor] > .uc-wrapper {
      --l-edit-button-width: 70px;
      --l-toolbar-horizontal-padding: var(--cldtr-gap-min);
    }
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-image_container > .uc-image {
    --viewer-image-opacity: 1;
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 10;
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    object-fit: scale-down;
    background-color: var(--color-image-background);
    transform: scale(1);
    opacity: var(--viewer-image-opacity);
    user-select: none;
    pointer-events: auto;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-image_container > .uc-image.uc-image_visible_viewer {
    transition: opacity var(--transition-duration-3) ease-in-out, transform var(--transition-duration-4);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-image_container > .uc-image.uc-image_hidden_to_cropper {
    --viewer-image-opacity: 0;
    background-image: var(--transparent-pixel);
    transform: scale(1);
    transition: transform var(--transition-duration-4), opacity var(--transition-duration-3) steps(1, jump-end);
    pointer-events: none;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-image_container > .uc-image.uc-image_hidden_effects {
    --viewer-image-opacity: 0;
    transform: scale(1);
    transition: opacity var(--transition-duration-3) cubic-bezier(0.5, 0, 1, 1), transform var(--transition-duration-4);
    pointer-events: none;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-image_container {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--color-image-background);
    transition: var(--transition-duration-3);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-toolbar {
    position: relative;
    transition: 0.3s;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-toolbar > .uc-toolbar_content {
    position: absolute;
    bottom: 0px;
    left: 0px;
    box-sizing: border-box;
    width: 100%;
    height: var(--modal-toolbar-height);
    min-height: var(--size-panel-heading);
    background-color: var(--color-fill-contrast);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-toolbar > .uc-toolbar_content.uc-toolbar_content__viewer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--size-panel-heading);
    padding-right: var(--l-toolbar-horizontal-padding);
    padding-left: var(--l-toolbar-horizontal-padding);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-toolbar > .uc-toolbar_content.uc-toolbar_content__editor {
    display: flex;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-info_pan {
    position: absolute;
    user-select: none;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-file_type_outer {
    position: absolute;
    z-index: 2;
    display: flex;
    max-width: 120px;
    transform: translateX(-40px);
    user-select: none;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-viewport > .uc-file_type_outer > .uc-file_type {
    padding: 4px 0.8em;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-network_problems_splash {
    position: absolute;
    z-index: 999;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--color-fill-contrast);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-network_problems_splash > .uc-network_problems_content {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-network_problems_splash > .uc-network_problems_content > .uc-network_problems_icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: var(--uc-foreground);
    background-color: var(--uc-muted);
    border-radius: 50%;
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-network_problems_splash > .uc-network_problems_content > .uc-network_problems_text {
    margin-top: var(--cldtr-gap-max);
    font-size: var(--font-size-ui);
    color: var(--uc-foreground);
  }
  [uc-cloud-image-editor] > .uc-wrapper > .uc-network_problems_splash > .uc-network_problems_footer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--size-panel-heading);
  }
  uc-crop-frame > .uc-svg {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-top-left-radius: var(--border-radius-base);
    border-top-right-radius: var(--border-radius-base);
    opacity: inherit;
    transition: var(--transition-duration-3);
  }
  uc-crop-frame > .uc-thumb {
    --idle-color-rgb: var(--color-text-base);
    --hover-color-rgb: var(--color-primary-accent);
    --focus-color-rgb: var(--color-primary-accent);
    --down-color-rgb: var(--color-primary-accent);
    --color-effect: var(--idle-color-rgb);
    color: var(--color-effect);
    transition: color var(--transition-duration-3), opacity var(--transition-duration-3);
  }
  uc-crop-frame .uc-thumb--visible {
    opacity: 1;
    pointer-events: auto;
  }
  uc-crop-frame .uc-thumb--hidden {
    opacity: 0;
    pointer-events: none;
  }
  uc-crop-frame .uc-guides {
    transition: var(--transition-duration-3);
  }
  uc-crop-frame .uc-guides--hidden {
    opacity: 0;
  }
  uc-crop-frame .uc-guides--semi-hidden {
    opacity: 0.2;
  }
  uc-crop-frame .uc-guides--visible {
    opacity: 1;
  }
  uc-editor-button-control,
  uc-editor-crop-button-control,
  uc-editor-aspect-ratio-button-control,
  uc-editor-freeform-button-control,
  uc-editor-filter-control,
  uc-editor-operation-control {
    --l-base-min-width: var(--uc-button-size);
    --l-base-height: var(--uc-button-size);
    --opacity-effect: var(--idle-opacity);
    --color-effect: var(--idle-color-rgb);
    --background-effect: var(--idle-background);
    --filter-effect: var(--idle-filter);
    --idle-color-rgb: var(--uc-secondary-foreground);
    --idle-opacity: 1;
    --idle-filter: 1;
    --idle-background: var(--uc-secondary);
    --hover-color-rgb: var(--uc-secondary-foreground);
    --hover-opacity: 1;
    --hover-filter: 0.8;
    --hover-background: var(--uc-secondary-hover);
    --down-color-rgb: var(--hover-color-rgb);
    --down-opacity: 1;
    --down-filter: 0.6;
    --down-background: var(--uc-secondary);
    border-radius: var(--uc-radius);
  }
  uc-editor-button-control > button,
  uc-editor-crop-button-control > button,
  uc-editor-aspect-ratio-button-control > button,
  uc-editor-freeform-button-control > button,
  uc-editor-filter-control > button,
  uc-editor-operation-control > button {
    all: unset;
    position: relative;
    display: grid;
    grid-template-columns: var(--l-base-min-width) auto;
    grid-template-rows: 100%;
    align-items: center;
    height: var(--l-base-height);
    color: var(--color-effect);
    opacity: var(--opacity-effect);
    cursor: pointer;
    transition: var(--l-width-transition);
  }
  uc-editor-freeform-button-control > button {
    grid-template-columns: auto var(--l-base-min-width);
  }
  uc-editor-freeform-button-control > button > uc-icon {
    margin-left: var(--cldtr-gap-mid-1);
    width: 10px;
  }
  :where(uc-editor-button-control, uc-editor-crop-button-control, uc-editor-aspect-ratio-button-control, uc-editor-freeform-button-control, uc-editor-filter-control, uc-editor-operation-control) > uc-icon > svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
  uc-editor-filter-control > uc-icon.uc-original-icon > svg {
    width: 100%;
    height: 100%;
  }
  uc-editor-button-control.uc-active,
  uc-editor-operation-control.uc-active,
  uc-editor-crop-button-control.uc-active,
  uc-editor-aspect-ratio-button-control.uc-active,
  uc-editor-freeform-button-control.uc-active,
  uc-editor-filter-control.uc-active {
    --idle-color-rgb: var(--uc-primary-foreground);
    --idle-background: var(--uc-primary);
    --idle-opacity: 1;
    --hover-color-rgb: var(--uc-primary-foreground);
    --hover-background: var(--uc-primary);
    --hover-opacity: 1;
  }
  uc-editor-button-control.uc-not_active,
  uc-editor-operation-control.uc-not_active,
  uc-editor-crop-button-control.uc-not_active,
  uc-editor-aspect-ratio-button-control.uc-not_active,
  uc-editor-freeform-button-control.uc-not_active,
  uc-editor-filter-control.uc-not_active {
    --idle-color-rgb: var(--uc-secondary-foreground);
  }
  :where(.uc-contrast) uc-editor-button-control.uc-not_active,
  :where(.uc-contrast) uc-editor-operation-control.uc-not_active,
  :where(.uc-contrast) uc-editor-crop-button-control.uc-not_active,
  :where(.uc-contrast) uc-editor-freeform-button-control.uc-not_active,
  :where(.uc-contrast) uc-editor-aspect-ratio-button-control.uc-not_active,
  :where(.uc-contrast) uc-editor-filter-control.uc-not_active {
    --idle-background: transparent;
    --hover-background: var(--uc-secondary);
    outline: 1px solid var(--uc-border);
    outline-offset: -1px;
  }
  uc-editor-button-control > button::before,
  uc-editor-operation-control > button::before,
  uc-editor-crop-button-control > button::before,
  uc-editor-freeform-button-control > button::before,
  uc-editor-aspect-ratio-button-control > button::before,
  uc-editor-filter-control > button::before {
    position: absolute;
    content: "";
    right: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    background-color: var(--background-effect);
    border-radius: var(--border-radius-editor);
    transition: var(--transition-duration-3);
  }
  uc-editor-button-control > button .uc-title,
  uc-editor-operation-control > button .uc-title,
  uc-editor-crop-button-control > button .uc-title,
  uc-editor-aspect-ratio-button-control > button .uc-title,
  uc-editor-freeform-button-control > button .uc-title,
  uc-editor-filter-control > button .uc-title {
    padding-right: var(--cldtr-gap-mid-1);
    font-size: 0.7em;
    letter-spacing: 1.004px;
    text-transform: uppercase;
  }
  uc-editor-freeform-button-control > button .uc-title {
    padding-left: var(--cldtr-gap-mid-1);
    padding-right: 0;
  }
  uc-editor-button-control > button uc-icon,
  uc-editor-operation-control > button uc-icon,
  uc-editor-crop-button-control > button uc-icon,
  uc-editor-aspect-ratio-button-control > button uc-icon,
  uc-editor-freeform-button-control > button uc-icon,
  uc-editor-filter-control > button uc-icon {
    pointer-events: none;
  }
  uc-editor-filter-control > button .uc-preview {
    position: absolute;
    right: 0;
    left: 0;
    z-index: -1;
    width: 100%;
    height: var(--l-base-height);
    background-repeat: no-repeat;
    background-size: contain;
    border-radius: var(--border-radius-editor);
    opacity: 0;
    filter: brightness(var(--filter-effect));
    transition: var(--transition-duration-3);
  }
  uc-editor-filter-control.uc-not_active .uc-preview[data-loaded] {
    opacity: 1;
  }
  uc-editor-filter-control.uc-active .uc-preview {
    opacity: 0;
  }
  uc-editor-filter-control > .uc-original-icon {
    color: var(--color-effect);
    opacity: 0.3;
  }
  uc-editor-image-cropper {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 10;
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    touch-action: none;
    color: var(--color-crop-guides);
  }
  uc-editor-image-cropper.uc-active_from_editor {
    transform: scale(1) translate(0px, 0px);
    opacity: 1;
    transition: transform var(--transition-duration-4) cubic-bezier(0.37, 0, 0.63, 1) 0.4s, opacity var(--transition-duration-3);
    pointer-events: auto;
  }
  uc-editor-image-cropper.uc-active_from_viewer {
    transform: scale(1) translate(0px, 0px);
    opacity: 1;
    transition: transform var(--transition-duration-4) cubic-bezier(0.37, 0, 0.63, 1) 0.4s, opacity var(--transition-duration-3);
    pointer-events: auto;
  }
  uc-editor-image-cropper.uc-inactive_to_editor {
    opacity: 0;
    transition: transform var(--transition-duration-4) cubic-bezier(0.37, 0, 0.63, 1), opacity var(--transition-duration-3) calc(var(--transition-duration-3) + 0.05s);
    pointer-events: none;
  }
  uc-editor-image-cropper > .uc-canvas {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
  }
  uc-editor-image-fader {
    position: absolute;
    top: 0px;
    left: 0px;
    display: block;
    width: 100%;
    height: 100%;
  }
  uc-editor-image-fader.uc-active_from_viewer {
    z-index: 3;
    transform: scale(1);
    opacity: 1;
    transition: transform var(--transition-duration-4), opacity var(--transition-duration-3) steps(1, jump-start);
    pointer-events: auto;
  }
  uc-editor-image-fader.uc-active_from_cropper {
    z-index: 3;
    transform: scale(1);
    opacity: 1;
    transition: transform var(--transition-duration-4), opacity var(--transition-duration-3) steps(1, jump-end);
    pointer-events: auto;
  }
  uc-editor-image-fader.uc-inactive_to_cropper {
    z-index: 3;
    transform: scale(1);
    opacity: 0;
    transition: transform var(--transition-duration-4), opacity var(--transition-duration-3) steps(1, jump-end);
    pointer-events: none;
  }
  uc-editor-image-fader .uc-fader-image {
    position: absolute;
    top: 0px;
    left: 0px;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: scale-down;
    transform: scale(1);
    user-select: none;
    content-visibility: auto;
  }
  uc-editor-image-fader .uc-fader-image--preview {
    background-color: var(--color-image-background);
    border-top-left-radius: var(--border-radius-base);
    border-top-right-radius: var(--border-radius-base);
    transform: scale(1);
    opacity: 0;
    transition: var(--transition-duration-3);
  }
  uc-editor-scroller {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow-x: scroll;
  }
  uc-editor-slider {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--size-panel-heading);
  }
  uc-editor-toolbar {
    position: relative;
    width: 100%;
    height: 100%;
  }
  @media only screen and (max-width: 600px) {
    uc-editor-toolbar {
      --l-tab-gap: var(--cldtr-gap-mid-1);
      --l-slider-padding: var(--uc-padding);
      --l-controls-padding: var(--uc-padding);
    }
  }
  @media only screen and (min-width: 601px) {
    uc-editor-toolbar {
      --l-tab-gap: var(--cldtr-gap-max);
      --l-slider-padding: var(--uc-padding);
      --l-controls-padding: var(--uc-padding);
    }
  }
  uc-editor-toolbar > .uc-toolbar-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar {
    position: absolute;
    display: grid;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    background-color: var(--color-fill-contrast);
    transition:
      opacity var(--transition-duration-3) ease-in-out,
      transform var(--transition-duration-3) ease-in-out,
      visibility var(--transition-duration-3) ease-in-out;
  }
  .uc-sub-toolbar > .uc-list-aspect-ratio-container > .uc-list-aspect-ratio {
    display: grid;
    grid-auto-flow: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
    height: var(--size-panel-heading);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar.uc-sub-toolbar--visible {
    transform: translateY(0px);
    opacity: 1;
    pointer-events: auto;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar.uc-sub-toolbar--top-hidden {
    transform: translateY(100%);
    opacity: 0;
    pointer-events: none;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar.uc-sub-toolbar--bottom-hidden {
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: var(--l-controls-padding);
    padding-left: var(--l-controls-padding);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles {
    position: relative;
    display: grid;
    grid-auto-flow: column;
    gap: 0px var(--l-tab-gap);
    align-items: center;
    height: 100%;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles > .uc-tab-toggles_indicator {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: var(--size-touch-area);
    height: 2px;
    background-color: var(--uc-secondary-foreground);
    transform: translateX(0px);
    transition: transform var(--transition-duration-3);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-tab-content-row {
    position: relative;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-tab-content-row > .uc-tab-content {
    position: absolute;
    top: 0px;
    left: 0px;
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    content-visibility: auto;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles > .uc-tab-toggle.uc-tab-toggle--visible {
    display: contents;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles > .uc-tab-toggle.uc-tab-toggle--hidden {
    display: none;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles.uc-tab-toggles--hidden {
    display: none;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles > .uc-tab-toggle > uc-btn-ui {
    width: var(--uc-button-size);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-controls-row > .uc-tab-toggles > .uc-tab-toggle > uc-btn-ui > uc-icon > svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-tab-content-row > .uc-tab-content .uc-controls-list_align {
    display: grid;
    grid-template-areas: ". inner .";
    grid-template-columns: 1fr auto 1fr;
    box-sizing: border-box;
    min-width: 100%;
    padding-left: var(--uc-padding);
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-tab-content-row > .uc-tab-content .uc-controls-list_inner {
    display: grid;
    grid-area: inner;
    grid-auto-flow: column;
    gap: 6px;
  }
  uc-editor-toolbar > .uc-toolbar-container > .uc-sub-toolbar > .uc-tab-content-row > .uc-tab-content .uc-controls-list_inner:last-child {
    padding-right: var(--uc-padding);
  }
  uc-editor-toolbar .uc-info-tooltip_container {
    position: absolute;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  uc-editor-toolbar .uc-info-tooltip_wrapper {
    position: absolute;
    top: calc(-100% - var(--cldtr-gap-mid-2));
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    pointer-events: none;
  }
  uc-editor-toolbar .uc-info-tooltip {
    z-index: 10;
    padding: 3px 6px;
    color: var(--color-text-base);
    font-size: 0.7em;
    letter-spacing: 1px;
    text-transform: uppercase;
    background-color: var(--color-text-accent-contrast);
    border-radius: var(--border-radius-editor);
    transform: translateY(100%);
    opacity: 0;
    transition: var(--transition-duration-3);
  }
  uc-editor-toolbar .uc-info-tooltip_visible {
    transform: translateY(0px);
    opacity: 1;
  }
  uc-editor-toolbar .uc-slider {
    padding-right: var(--l-slider-padding);
    padding-left: var(--l-slider-padding);
  }
  uc-btn-ui > button {
    --filter-effect: var(--idle-brightness);
    --opacity-effect: var(--idle-opacity);
    --color-effect: var(--idle-color-rgb);
    --background-effect: var(--idle-background);
    --l-transition-effect: var( --css-transition, color var(--transition-duration-2), background-color var(--transition-duration-2), filter var(--transition-duration-2) );
    all: unset;
    display: inline-flex;
    align-items: center;
    box-sizing: var(--css-box-sizing, border-box);
    height: var(--css-height, var(--uc-button-size));
    padding-right: var(--css-padding-right, 14px);
    padding-left: var(--css-padding-left, 14px);
    font-size: 1em;
    color: var(--color-effect);
    background-color: var(--background-effect);
    border-radius: var(--uc-radius);
    opacity: var(--opacity-effect);
    cursor: pointer;
    filter: brightness(var(--filter-effect));
    transition: var(--l-transition-effect);
    user-select: none;
  }
  uc-btn-ui > button > uc-icon {
    pointer-events: none;
  }
  uc-btn-ui .uc-text {
    white-space: nowrap;
  }
  uc-btn-ui .uc-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-effect);
    filter: brightness(var(--filter-effect));
    transition: var(--l-transition-effect);
  }
  uc-btn-ui .uc-icon_left {
    margin-right: var(--cldtr-gap-mid-1);
    margin-left: 0px;
  }
  uc-btn-ui .uc-icon_right {
    margin-right: 0px;
    margin-left: var(--cldtr-gap-mid-1);
  }
  uc-btn-ui .uc-icon_single {
    margin-right: 0px;
    margin-left: 0px;
  }
  uc-btn-ui .uc-icon_hidden {
    display: none;
    margin: 0;
  }
  uc-btn-ui.uc-primary > button {
    --idle-color-rgb: var(--uc-primary-foreground);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: var(--uc-primary);
    --hover-color-rgb: var(--uc-primary-foreground);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-primary-hover);
    --down-color-rgb: var(--uc-primary-foreground);
    --down-brightness: 0.75;
    --down-opacity: 1;
    --down-background: var(--uc-primary);
    --active-color-rgb: var(--uc-primary-foreground);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: var(--uc-primary);
  }
  uc-btn-ui.uc-primary-icon > button {
    --idle-color-rgb: var(--uc-primary);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: transparent;
    --hover-color-rgb: var(--uc-primary);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-primary-transparent);
    --down-color-rgb: var(--uc-primary);
    --down-brightness: 0.75;
    --down-opacity: 1;
    --down-background: var(--uc-primary-transparent);
    --active-color-rgb: var(--uc-primary-foreground);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: var(--uc-primary);
    padding: 0;
    width: var(--uc-button-size);
  }
  uc-btn-ui.uc-secondary > button {
    --idle-color-rgb: var(--uc-secondary-foreground);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: var(--uc-secondary);
    --hover-color-rgb: var(--uc-secondary-foreground);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-secondary-hover);
    --down-color-rgb: var(--uc-secondary-foreground);
    --down-brightness: 1;
    --down-opacity: 1;
    --down-background: var(--uc-secondary-hover);
    --active-color-rgb: var(--uc-secondary-foreground);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: transparent;
  }
  :where(.uc-contrast) uc-btn-ui.uc-secondary > button {
    border: 1px solid var(--uc-border);
  }
  uc-btn-ui.uc-secondary-icon > button {
    --idle-color-rgb: var(--uc-secondary-foreground);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: transparent;
    --hover-color-rgb: var(--uc-secondary-foreground);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-secondary);
    --down-color-rgb: var(--uc-secondary-foreground);
    --down-brightness: 1;
    --down-opacity: 1;
    --down-background: var(--uc-secondary);
    --active-color-rgb: var(--uc-secondary-foreground);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: transparent;
    padding: 0;
    width: var(--uc-button-size);
  }
  uc-btn-ui.uc-tab > button {
    --idle-color-rgb: var(--uc-secondary-foreground);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: transparent;
    --hover-color-rgb: var(--uc-secondary-foreground);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-secondary);
    --down-color-rgb: var(--uc-secondary-foreground);
    --down-brightness: 1;
    --down-opacity: 1;
    --down-background: var(--uc-secondary);
    --active-color-rgb: var(--uc-secondary-foreground);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: transparent;
    padding: 0;
    width: var(--uc-button-size);
  }
  uc-btn-ui.uc-default > button {
    --idle-color-rgb: var(--uc-secondary-foreground);
    --idle-brightness: 1;
    --idle-opacity: 1;
    --idle-background: var(--uc-secondary);
    --hover-color-rgb: var(--uc-secondary-foreground);
    --hover-brightness: 1;
    --hover-opacity: 1;
    --hover-background: var(--uc-secondary-hover);
    --down-color-rgb: var(--uc-secondary-foreground);
    --down-brightness: 0.75;
    --down-opacity: 1;
    --down-background: var(--uc-secondary);
    --active-color-rgb: var(--uc-primary);
    --active-brightness: 1;
    --active-opacity: 1;
    --active-background: var(--uc-primary-transparent);
  }
  :where(.uc-contrast) uc-btn-ui.uc-default > button {
    --idle-background: transparent;
    --hover-background: var(--uc-secondary);
    --active-background: var(--uc-foreground);
    --active-color-rgb: var(--uc-background);
  }
  uc-line-loader-ui {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 9999;
    width: 100%;
    height: 2px;
    opacity: 0.5;
  }
  uc-line-loader-ui .uc-inner {
    width: 25%;
    max-width: 200px;
    height: 100%;
  }
  uc-line-loader-ui .uc-line {
    width: 100%;
    height: 100%;
    background-color: var(--uc-primary);
    transform: translateX(-101%);
    transition: transform 1s;
  }
  uc-slider-ui {
    --l-thumb-size: 24px;
    --l-zero-dot-size: 5px;
    --l-zero-dot-offset: 2px;
    --idle-color-rgb: var(--uc-foreground);
    --hover-color-rgb: var(--uc-primary);
    --down-color-rgb: var(--uc-primary);
    --color-effect: var(--idle-color-rgb);
    --l-color: var(--color-effect);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: calc(var(--l-thumb-size) + (var(--l-zero-dot-size) + var(--l-zero-dot-offset)) * 2);
  }
  uc-slider-ui .uc-thumb {
    position: absolute;
    left: 0px;
    width: var(--l-thumb-size);
    height: var(--l-thumb-size);
    background-color: var(--l-color);
    border-radius: 50%;
    transform: translateX(0px);
    opacity: 1;
    transition: opacity var(--transition-duration-2), background-color var(--transition-duration-2);
  }
  uc-slider-ui .uc-steps {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding-right: calc(var(--l-thumb-size) / 2);
    padding-left: calc(var(--l-thumb-size) / 2);
  }
  uc-slider-ui .uc-border-step {
    width: 0px;
    height: 10px;
    border-right: 1px solid var(--uc-foreground);
    opacity: 1;
    transition: border-color var(--transition-duration-2);
  }
  uc-slider-ui .uc-minor-step {
    width: 0px;
    height: 4px;
    border-right: 1px solid var(--uc-foreground);
    opacity: 0.6;
    transition: border-color var(--transition-duration-2);
  }
  uc-slider-ui .uc-zero-dot {
    position: absolute;
    top: calc(100% - var(--l-zero-dot-offset) * 2);
    left: calc(var(--l-thumb-size) / 2 - var(--l-zero-dot-size) / 2);
    width: var(--l-zero-dot-size);
    height: var(--l-zero-dot-size);
    background-color: var(--color-primary-accent);
    border-radius: 50%;
    opacity: 0;
    transition: var(--transition-duration-3);
  }
  uc-slider-ui .uc-input {
    position: absolute;
    width: calc(100% - 10px);
    height: 100%;
    margin: 0;
    cursor: pointer;
    opacity: 0;
  }
  uc-presence-toggle.uc-transition {
    transition: opacity var(--transition-duration-3), visibility var(--transition-duration-3);
  }
  uc-presence-toggle.uc-visible {
    opacity: 1;
    pointer-events: inherit;
  }
  uc-presence-toggle.uc-hidden {
    opacity: 0;
    pointer-events: none;
  }
  uc-presence-toggle.uc-initial {
    display: none !important;
    transition: none !important;
  }
  [uc-cloud-image-editor] [role=button]:focus-visible,
  [uc-cloud-image-editor] button:focus-visible {
    outline: 1px auto Highlight;
    outline: 1px auto -webkit-focus-ring-color;
  }
  [uc-cloud-image-editor] .uc-cloud-mask {
    pointer-events: none;
  }
  [uc-aspect-ratio-freeform] button {
    display: flex;
  }
  [uc-aspect-ratio-freeform] uc-icon {
    display: none;
  }
  [uc-aspect-ratio-freeform] .uc-title {
    padding-left: var(--cldtr-gap-mid-1);
  }
  :where(uc-editor-freeform-button-control, uc-editor-aspect-ratio-button-control:last-of-type) {
    margin-right: calc(3 * var(--cldtr-gap-mid-1));
  }
}

/* src/blocks/CloudImageEditor/src/css/icons.css */
@layer uc.solutions {
  :where([uc-cloud-image-editor]) uc-icon {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  :where([uc-cloud-image-editor]) uc-icon svg {
    width: calc(var(--uc-button-size) / 2);
    height: calc(var(--uc-button-size) / 2);
  }
}

/* src/blocks/CloudImageEditor/src/css/index.css */

/* src/blocks/CloudImageEditor/index.css */

/* src/solutions/cloud-image-editor/index.css */

/* src/solutions/file-uploader/inline/index.css */
@layer uc.solutions {
  [uc-file-uploader-inline] uc-start-from {
    height: 100%;
    container-type: inline-size;
  }
  [uc-file-uploader-inline] {
    --cfg-done-activity: "start-from";
    --cfg-init-activity: "start-from";
    flex: 1;
  }
  [uc-file-uploader-inline] uc-activity-header::after {
    width: var(--uc-button-size);
    height: var(--uc-button-size);
    content: "";
  }
  [uc-file-uploader-inline] uc-activity-header .uc-close-btn {
    display: none;
  }
  [uc-file-uploader-inline] uc-copyright .uc-credits {
    position: static;
  }
  @container (min-width: 500px) {
    [uc-file-uploader-inline] uc-start-from .uc-content {
      grid-template-columns: 1fr max-content;
      grid-template-rows: 1fr max-content;
      height: 100%;
    }
    [uc-file-uploader-inline] uc-start-from uc-copyright {
      grid-column: 2;
    }
    [uc-file-uploader-inline] uc-start-from uc-drop-area {
      grid-row: span 3;
    }
    [uc-file-uploader-inline] uc-start-from:has(uc-copyright[hidden]) uc-drop-area {
      grid-row: span 2;
    }
    [uc-file-uploader-inline] uc-start-from:has(.uc-cancel-btn[hidden]) uc-drop-area {
      grid-row: span 2;
    }
    [uc-file-uploader-inline] uc-start-from:has(uc-copyright[hidden]):has(.uc-cancel-btn[hidden]) uc-drop-area {
      grid-row: span 1;
    }
  }
}

/* src/blocks/themes/uc-basic/layers.css */
@layer uc, uc.base, uc.shared, uc.components, uc.rules, uc.solutions, uc.post-reset;

/* src/blocks/themes/uc-basic/config.css */
@layer uc.base {
  :where([uc-wgt-common]) {
    --cfg-init-activity: "start-from";
    --cfg-done-activity: "";
  }
}

/* src/blocks/themes/uc-basic/theme.css */
@layer uc.base {
  :where([uc-wgt-common]) {
    --uc-font-family: system-ui;
    --uc-font-size: 14px;
    --uc-line-height: normal;
    --uc-simple-btn-font-family: system-ui;
    --uc-simple-btn-font-size: 14px;
    --uc-button-size: 32px;
    --uc-preview-size: 32px;
    --uc-padding: 10px;
    --uc-radius: 8px;
    --uc-transition: 0.2s ease;
    --uc-dialog-width: 430px;
    --uc-dialog-max-width: 920px;
    --uc-dialog-max-height: 675px;
    --uc-simple-btn-padding: 7px 14px;
    --uc-grid-col: 3;
    --uc-grid-preview-image-height: auto;
    --uc-grid-gap: calc(var(--uc-padding) / 2);
    --uc-grid-aspect-ratio: 1 / 1;
    --uc-background: var(--uc-background-light);
    --uc-foreground: var(--uc-foreground-light);
    --uc-primary: var(--uc-primary-light);
    --uc-primary-hover: var(--uc-primary-hover-light);
    --uc-primary-transparent: var(--uc-primary-transparent-light);
    --uc-primary-foreground: var(--uc-primary-foreground-light);
    --uc-secondary: var(--uc-secondary-light);
    --uc-secondary-hover: var(--uc-secondary-hover-light);
    --uc-secondary-foreground: var(--uc-secondary-foreground-light);
    --uc-muted: var(--uc-muted-light);
    --uc-muted-foreground: var(--uc-muted-foreground-light);
    --uc-destructive: var(--uc-destructive-light);
    --uc-destructive-foreground: var(--uc-destructive-foreground-light);
    --uc-border: var(--uc-border-light);
    --uc-dialog-shadow: var(--uc-dialog-shadow-light);
    --uc-simple-btn: var(--uc-simple-btn-light);
    --uc-simple-btn-hover: var(--uc-simple-btn-hover-light);
    --uc-simple-btn-foreground: var(--uc-simple-btn-foreground-light);
  }
  @supports not (color: oklch(0% 0 0)) {
    :where([uc-wgt-common]) {
      --uc-primary-rgb-light: 23 75 215;
      --uc-primary-light: rgb(var(--uc-primary-rgb-light));
      --uc-primary-hover-light: rgb(var(--uc-primary-rgb-light) / 90%);
      --uc-primary-transparent-light: rgb(var(--uc-primary-rgb-light) / 10%);
      --uc-background-light: rgb(255 255 255);
      --uc-foreground-light: rgb(24 24 24);
      --uc-primary-foreground-light: #fff;
      --uc-secondary-light: rgb(24 24 24 / 5%);
      --uc-secondary-hover-light: rgb(24 24 24 / 8%);
      --uc-secondary-foreground-light: rgb(24 24 24);
      --uc-muted-light: rgb(245 245 245);
      --uc-muted-foreground-light: rgb(113 113 113);
      --uc-destructive-light: rgb(232 19 20 / 5%);
      --uc-destructive-foreground-light: rgb(232 19 20);
      --uc-border-light: rgb(228 228 232);
      --uc-dialog-shadow-light: 0px 6px 20px rgb(0 0 0 / 10%);
      --uc-simple-btn-light: rgb(235 235 235);
      --uc-simple-btn-hover-light: rgb(228 228 228);
      --uc-simple-btn-foreground-light: rgb(24 24 24);
      --uc-primary-rgb-dark: 87 154 255;
      --uc-primary-dark: rgb(var(--uc-primary-rgb-dark));
      --uc-primary-hover-dark: rgb(var(--uc-primary-rgb-dark) / 90%);
      --uc-primary-transparent-dark: rgb(var(--uc-primary-rgb-dark) / 7%);
      --uc-background-dark: rgb(27 27 27);
      --uc-foreground-dark: rgb(225 225 225);
      --uc-primary-foreground-dark: rgb(0 0 0);
      --uc-secondary-dark: rgb(225 225 225 / 7%);
      --uc-secondary-hover-dark: rgb(225 225 225 / 10%);
      --uc-secondary-foreground-dark: rgb(225 225 225);
      --uc-muted-dark: rgb(36 36 36);
      --uc-muted-foreground-dark: rgb(152 152 152);
      --uc-destructive-dark: rgb(244 90 79 / 10%);
      --uc-destructive-foreground-dark: rgb(244 90 79);
      --uc-border-dark: rgb(61 61 61);
      --uc-dialog-shadow-dark: 0px 6px 20px rgb(0 0 0 / 25%);
      --uc-simple-btn-dark: rgb(36 36 36);
      --uc-simple-btn-hover-dark: rgb(43 43 43);
      --uc-simple-btn-foreground-dark: rgb(255 255 255);
    }
  }
  @supports (color: oklch(0% 0 0)) {
    :where([uc-wgt-common]) {
      --uc-primary-oklch-light: 47% 0.22 264;
      --uc-primary-light: oklch(var(--uc-primary-oklch-light));
      --uc-primary-hover-light: oklch(var(--uc-primary-oklch-light) / 90%);
      --uc-primary-transparent-light: oklch(var(--uc-primary-oklch-light) / 7%);
      --uc-background-light: oklch(100% 0 0);
      --uc-foreground-light: oklch(21% 0 0);
      --uc-primary-foreground-light: oklch(100% 0 0);
      --uc-secondary-light: oklch(21% 0 0 / 0.05);
      --uc-secondary-hover-light: oklch(21% 0 0 / 0.08);
      --uc-secondary-foreground-light: oklch(21% 0 0);
      --uc-muted-light: oklch(97% 0 0);
      --uc-muted-foreground-light: oklch(40% 0 0);
      --uc-destructive-light: oklch(59% 0.235 28.5 / 0.05);
      --uc-destructive-foreground-light: oklch(59% 0.235 28.5);
      --uc-border-light: oklch(92% 0 0);
      --uc-dialog-shadow-light: 0px 6px 20px oklch(0% 0 0 / 0.1);
      --uc-simple-btn-light: oklch(94% 0 0);
      --uc-simple-btn-hover-light: oklch(92% 0 0);
      --uc-simple-btn-foreground-light: oklch(20% 0 0);
      --uc-primary-oklch-dark: 69% 0.1768 258.4;
      --uc-primary-dark: oklch(var(--uc-primary-oklch-dark));
      --uc-primary-hover-dark: oklch(var(--uc-primary-oklch-dark) / 90%);
      --uc-primary-transparent-dark: oklch(var(--uc-primary-oklch-dark) / 7%);
      --uc-background-dark: oklch(22% 0 0);
      --uc-foreground-dark: oklch(91% 0 0);
      --uc-primary-foreground-dark: oklch(0% 0 0);
      --uc-secondary-dark: oklch(91% 0 0 / 0.07);
      --uc-secondary-hover-dark: oklch(91% 0 0 / 0.1);
      --uc-secondary-foreground-dark: oklch(91% 0 0);
      --uc-muted-dark: oklch(26% 0 0);
      --uc-muted-foreground-dark: oklch(68% 0 0);
      --uc-destructive-dark: oklch(67% 0.191 27.5 / 0.1);
      --uc-destructive-foreground-dark: oklch(67% 0.191 27.5);
      --uc-border-dark: oklch(36% 0 0);
      --uc-dialog-shadow-dark: 0px 6px 20px oklch(0% 0 0 / 0.25);
      --uc-simple-btn-dark: oklch(26% 0 0);
      --uc-simple-btn-hover-dark: oklch(29% 0 0);
      --uc-simple-btn-foreground-dark: oklch(100% 0 0);
    }
  }
  @media only screen and (max-height: 600px) {
    :where([uc-wgt-common]) {
      --uc-dialog-max-height: 100%;
    }
  }
  @media only screen and (max-width: 680px) {
    :where([uc-wgt-common]) {
      --uc-grid-col: 2;
    }
  }
  @media only screen and (max-width: 430px) {
    :where([uc-wgt-common]) {
      --uc-dialog-max-width: 100vw;
      --uc-dialog-max-height: var(--uploadcare-blocks-window-height);
      --uc-grid-col: 1;
    }
  }
  @media (prefers-color-scheme: light) {
    :where([uc-wgt-common]) {
      --uc-background: var(--uc-background-light);
      --uc-foreground: var(--uc-foreground-light);
      --uc-primary: var(--uc-primary-light);
      --uc-primary-hover: var(--uc-primary-hover-light);
      --uc-primary-transparent: var(--uc-primary-transparent-light);
      --uc-primary-foreground: var(--uc-primary-foreground-light);
      --uc-secondary: var(--uc-secondary-light);
      --uc-secondary-hover: var(--uc-secondary-hover-light);
      --uc-secondary-foreground: var(--uc-secondary-foreground-light);
      --uc-muted: var(--uc-muted-light);
      --uc-muted-foreground: var(--uc-muted-foreground-light);
      --uc-destructive: var(--uc-destructive-light);
      --uc-destructive-foreground: var(--uc-destructive-foreground-light);
      --uc-border: var(--uc-border-light);
      --uc-dialog-shadow: var(--uc-dialog-shadow-light);
      --uc-simple-btn: var(--uc-simple-btn-light);
      --uc-simple-btn-hover: var(--uc-simple-btn-hover-light);
      --uc-simple-btn-foreground: var(--uc-simple-btn-foreground-light);
    }
  }
  @media (prefers-color-scheme: dark) {
    :where([uc-wgt-common]) {
      --uc-background: var(--uc-background-dark);
      --uc-foreground: var(--uc-foreground-dark);
      --uc-primary: var(--uc-primary-dark);
      --uc-primary-hover: var(--uc-primary-hover-dark);
      --uc-primary-transparent: var(--uc-primary-transparent-dark);
      --uc-primary-foreground: var(--uc-primary-foreground-dark);
      --uc-secondary: var(--uc-secondary-dark);
      --uc-secondary-hover: var(--uc-secondary-hover-dark);
      --uc-secondary-foreground: var(--uc-secondary-foreground-dark);
      --uc-muted: var(--uc-muted-dark);
      --uc-muted-foreground: var(--uc-muted-foreground-dark);
      --uc-destructive: var(--uc-destructive-dark);
      --uc-destructive-foreground: var(--uc-destructive-foreground-dark);
      --uc-border: var(--uc-border-dark);
      --uc-dialog-shadow: var(--uc-dialog-shadow-dark);
      --uc-simple-btn: var(--uc-simple-btn-dark);
      --uc-simple-btn-hover: var(--uc-simple-btn-hover-dark);
      --uc-simple-btn-foreground: var(--uc-simple-btn-foreground-dark);
    }
  }
  :where(.uc-light),
  :where(.uc-light) :where([uc-wgt-common]) {
    --uc-background: var(--uc-background-light);
    --uc-foreground: var(--uc-foreground-light);
    --uc-primary: var(--uc-primary-light);
    --uc-primary-hover: var(--uc-primary-hover-light);
    --uc-primary-transparent: var(--uc-primary-transparent-light);
    --uc-primary-foreground: var(--uc-primary-foreground-light);
    --uc-secondary: var(--uc-secondary-light);
    --uc-secondary-hover: var(--uc-secondary-hover-light);
    --uc-secondary-foreground: var(--uc-secondary-foreground-light);
    --uc-muted: var(--uc-muted-light);
    --uc-muted-foreground: var(--uc-muted-foreground-light);
    --uc-destructive: var(--uc-destructive-light);
    --uc-destructive-foreground: var(--uc-destructive-foreground-light);
    --uc-border: var(--uc-border-light);
    --uc-dialog-shadow: var(--uc-dialog-shadow-light);
    --uc-simple-btn: var(--uc-simple-btn-light);
    --uc-simple-btn-hover: var(--uc-simple-btn-hover-light);
    --uc-simple-btn-foreground: var(--uc-simple-btn-foreground-light);
  }
  :where(.uc-dark),
  :where(.uc-dark) :where([uc-wgt-common]) {
    --uc-background: var(--uc-background-dark);
    --uc-foreground: var(--uc-foreground-dark);
    --uc-primary: var(--uc-primary-dark);
    --uc-primary-hover: var(--uc-primary-hover-dark);
    --uc-primary-transparent: var(--uc-primary-transparent-dark);
    --uc-primary-foreground: var(--uc-primary-foreground-dark);
    --uc-secondary: var(--uc-secondary-dark);
    --uc-secondary-hover: var(--uc-secondary-hover-dark);
    --uc-secondary-foreground: var(--uc-secondary-foreground-dark);
    --uc-muted: var(--uc-muted-dark);
    --uc-muted-foreground: var(--uc-muted-foreground-dark);
    --uc-destructive: var(--uc-destructive-dark);
    --uc-destructive-foreground: var(--uc-destructive-foreground-dark);
    --uc-border: var(--uc-border-dark);
    --uc-dialog-shadow: var(--uc-dialog-shadow-dark);
    --uc-simple-btn: var(--uc-simple-btn-dark);
    --uc-simple-btn-hover: var(--uc-simple-btn-hover-dark);
    --uc-simple-btn-foreground: var(--uc-simple-btn-foreground-dark);
  }
  :where(.uc-purple) {
    --uc-primary-oklch-light: 47% 0.22 300;
    --uc-primary-oklch-dark: 69% 0.1768 300;
  }
  :where(.uc-red) {
    --uc-primary-oklch-light: 47% 0.21 21;
    --uc-primary-oklch-dark: 71% 0.1768 21;
  }
  :where(.uc-orange) {
    --uc-primary-oklch-light: 47% 0.1376 51.88;
    --uc-primary-oklch-dark: 69% 0.1768 51.88;
  }
  :where(.uc-green) {
    --uc-primary-oklch-light: 45% 0.14 130;
    --uc-primary-oklch-dark: 69% 0.1768 130;
  }
  :where(.uc-turquoise) {
    --uc-primary-oklch-light: 45% 0.0854 174;
    --uc-primary-oklch-dark: 69% 0.1768 174;
  }
  :where(.uc-gray) {
    --uc-primary-oklch-light: 10% 0 0;
    --uc-primary-oklch-dark: 97% 0 0;
  }
  :where(.uc-contrast) {
    --uc-border-light: oklch(50% 0 0);
    --uc-border-dark: oklch(50% 0 0);
    --uc-muted-light: oklch(98% 0 0);
    --uc-muted-dark: oklch(16% 0 0);
    --uc-muted-foreground-light: oklch(20% 0 0);
    --uc-muted-foreground-dark: oklch(80% 0 0);
    --uc-background-light: oklch(100% 0 0);
    --uc-foreground-light: oklch(0% 0 0);
    --uc-background-dark: oklch(10% 0 0);
    --uc-foreground-dark: oklch(100% 0 0);
  }
  :where(.uc-radius-none) {
    --uc-radius: 0;
  }
  :where(.uc-radius-small) {
    --uc-radius: 5px;
  }
  :where(.uc-radius-medium) {
    --uc-radius: 8px;
  }
  :where(.uc-radius-large) {
    --uc-radius: 16px;
  }
}

/* src/blocks/themes/uc-basic/common.css */
@layer uc.base {
  :where([uc-wgt-common]) {
    color: var(--uc-foreground);
    font-size: var(--uc-font-size);
    line-height: var(--uc-line-height);
    font-family: var(--uc-font-family);
  }
  :where([uc-wgt-common]) * {
    box-sizing: border-box;
  }
  :where([uc-wgt-common]) button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--uc-button-size);
    padding-right: 14px;
    padding-left: 14px;
    font-size: 1em;
    font-family: inherit;
    white-space: nowrap;
    border: none;
    border-radius: var(--uc-radius);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--uc-transition);
  }
  :where([uc-wgt-common]) button:focus-visible {
    outline-offset: 2px;
  }
}
@layer uc.shared {
  :where([uc-wgt-common]) :is(button.uc-primary-btn, button.uc-ui-primary-btn) {
    color: var(--uc-primary-foreground);
    background-color: var(--uc-primary);
  }
  :where([uc-wgt-common]) :is(button.uc-primary-btn, button.uc-ui-primary-btn):hover {
    background-color: var(--uc-primary-hover);
  }
  :where([uc-wgt-common]) :is(button.uc-secondary-btn, button.uc-ui-secondary-btn) {
    color: var(--uc-secondary-foreground);
    background-color: var(--uc-secondary);
  }
  :where([uc-wgt-common]) :is(button.uc-secondary-btn, button.uc-ui-secondary-btn):hover {
    background-color: var(--uc-secondary-hover);
  }
  :where([uc-wgt-common].uc-contrast) :is(button.uc-secondary-btn, button.uc-ui-secondary-btn) {
    border: 1px solid var(--uc-border);
  }
  :where([uc-wgt-common]) :is(button.uc-mini-btn, button.uc-ui-icon-btn) {
    height: var(--uc-button-size);
    padding: 0;
    background-color: transparent;
    color: var(--uc-secondary-foreground);
  }
  :where([uc-wgt-common]) :is(button.uc-mini-btn, button.uc-ui-icon-btn):hover {
    background-color: var(--uc-secondary);
  }
  :where([uc-wgt-common]) :is(button[disabled], button.uc-primary-btn[disabled], button.uc-secondary-btn[disabled], button.uc-ui-primary-btn[disabled], button.uc-ui-secondary-btn[disabled], button.uc-ui-icon-btn[disabled]) {
    opacity: 0.5;
    pointer-events: none;
  }
  :where([uc-wgt-common]) a {
    color: var(--uc-primary);
    text-decoration: none;
  }
  :where([uc-wgt-common]) a[disabled] {
    pointer-events: none;
  }
  :where([uc-wgt-common]) input[type=text] {
    display: flex;
    width: 100%;
    height: var(--uc-button-size);
    padding-right: 10px;
    padding-left: 10px;
    color: var(--uc-foreground);
    font-size: 1em;
    font-family: inherit;
    background-color: var(--uc-background);
    border: 1px solid var(--uc-border);
    outline: 1px solid transparent;
    border-radius: var(--uc-radius);
    transition: border-color var(--uc-transition), outline-color var(--uc-transition);
  }
  :where([uc-wgt-common]) input[type=text]::placeholder {
    color: var(--uc-muted-foreground);
  }
  :where([uc-wgt-common]) input[type=text]:focus {
    outline-color: var(--uc-primary-hover);
    border-color: var(--uc-primary-hover);
  }
  :where([uc-wgt-common]) input[disabled] {
    opacity: 0.6;
    pointer-events: none;
  }
  :where([uc-wgt-common]) uc-select[disabled],
  :where([uc-wgt-common]) select[disabled] {
    opacity: 0.6;
    pointer-events: none;
  }
  :where([uc-wgt-common]) .uc-ui-toolbar {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: var(--uc-padding);
    background-color: var(--uc-background);
  }
  :where([uc-wgt-common]) .uc-ui-toolbar-spacer {
    flex: 1;
  }
}

/* src/blocks/themes/uc-basic/rules.css */
@layer uc.rules {
  :where([uc-wgt-common]) [hidden] {
    display: none;
  }
  :where([uc-wgt-common]) [activity]:not([active], .active) {
    display: none;
  }
  :where([uc-wgt-common]) dialog:not([open]) [activity] {
    display: none;
  }
}

/* src/blocks/themes/uc-basic/post-reset.css */
@layer uc.post-reset {
  :where([uc-wgt-common]) uc-source-btn[type] {
    all: unset;
  }
}

/* src/blocks/themes/uc-basic/index.css */

/* src/solutions/file-uploader/minimal/index.css */
@layer uc.solutions {
  :where([uc-file-uploader-minimal]) {
    --cfg-init-activity: "start-from";
    --cfg-done-activity: "upload-list";
    position: relative;
    display: block;
  }
  [uc-file-uploader-minimal] > uc-start-from .uc-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
    overflow: hidden;
    align-items: center;
    background-color: transparent;
  }
  :where([uc-file-uploader-minimal] > uc-start-from uc-drop-area) {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: calc(var(--uc-preview-size) + var(--uc-padding) * 2 + 8px);
    padding: 0;
    text-align: center;
    background-color: var(--uc-muted);
    border-radius: calc(var(--uc-radius) * 1.75);
  }
  :where(.uc-contrast) :where([uc-file-uploader-minimal] > uc-start-from uc-drop-area) {
    background-color: transparent;
  }
  :where([uc-file-uploader-minimal] > uc-start-from uc-drop-area)::before {
    content: "";
    z-index: -1;
    width: 100%;
    height: 100%;
    position: absolute;
    background-color: var(--uc-background);
  }
  :where([uc-file-uploader-minimal]:has([single]) > uc-start-from uc-drop-area) {
    aspect-ratio: var(--uc-grid-aspect-ratio);
  }
  [uc-file-uploader-minimal] uc-upload-list uc-activity-header {
    display: none;
  }
  [uc-file-uploader-minimal] uc-upload-list > .uc-toolbar {
    background-color: transparent;
  }
  [uc-file-uploader-minimal] uc-upload-list {
    width: 100%;
    height: unset;
    padding: 4px;
    background-color: var(--uc-background);
    border: 1px dashed var(--uc-border);
    border-radius: calc(var(--uc-radius) * 1.75);
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-files {
    padding: 0;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar {
    display: block;
    padding: 0;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-cancel-btn,
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-upload-btn,
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-done-btn {
    display: none;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-add-more-btn {
    width: 100%;
    height: calc(var(--uc-preview-size) + var(--uc-padding) * 2);
    margin-top: 4px;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-add-more-btn[disabled] {
    display: none;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-add-more-btn > span {
    display: none;
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-toolbar .uc-add-more-btn > uc-icon {
    display: flex;
  }
  [uc-file-uploader-minimal][mode=list] uc-file-item uc-progress-bar {
    top: 0;
    height: 100%;
  }
  [uc-file-uploader-minimal][mode=list] uc-file-item uc-progress-bar .uc-progress {
    background-color: var(--uc-primary-transparent);
    border-radius: var(--uc-radius);
  }
  [uc-file-uploader-minimal][mode=list] uc-file-item uc-progress-bar .uc-fake-progress {
    background-color: var(--uc-primary-transparent);
    border-radius: var(--uc-radius);
  }
  [uc-file-uploader-minimal] uc-upload-list uc-drop-area {
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: calc(var(--uc-radius) * 1.75);
  }
  [uc-file-uploader-minimal] uc-upload-list .uc-common-error {
    margin: 4px 0 0;
  }
  [uc-file-uploader-minimal] uc-copyright .uc-credits {
    position: static;
  }
  [uc-file-uploader-minimal][mode=grid] uc-upload-list .uc-toolbar .uc-add-more-btn {
    display: none;
  }
  [uc-file-uploader-minimal][mode=grid] uc-upload-list .uc-files .uc-add-more-btn {
    display: flex;
  }
  [uc-file-uploader-minimal][mode=grid] uc-upload-list .uc-files .uc-add-more-btn > span {
    display: none;
  }
  [uc-file-uploader-minimal][mode=grid] uc-upload-list .uc-files .uc-add-more-btn > uc-icon {
    display: flex;
  }
}
    `),
}))

// ─── Types ─────────────────────────────

type FileUploaderModes = "inline" | "regular" | "minimal"
type FilesViewMode = "list" | "grid"
type MetadataItem = { key: string; value: string }
type Metadata = Record<string, string>
type BooleanMap = Record<string, boolean>
type UploadcareConfigElement = HTMLElement & {
    metadata?: () => Metadata | null
}
type UploadcareModule = unknown

type FileUploaderWidget = {
    classWrapper: string

    mode: FileUploaderModes
    theme: "auto" | "light" | "dark" | "custom"
    colors: {
        light: string
        dark: string
    }
    fieldName: string

    pubkey: string
    multiple: boolean
    multipleMin: number
    multipleMax: number

    confirmUpload: boolean
    imgOnly: boolean
    accept: string
    store: "auto" | "true" | "false"
    groupOutput: boolean
    metadata: MetadataItem[]

    sourceList: BooleanMap

    filesViewMode: FilesViewMode
    gridShowFileNames: boolean

    pasteScope: "local" | "global" | "false"

    dynamicButton: boolean
    dynamicButtonViewMode: string
}

// ─── Utilities ─────────────────────────────
function rgbToOklch(color: string): string | null {
    if (!color) return null

    const match = color.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i
    )

    if (!match) return null

    const r = Math.min(255, Number(match[1])) / 255
    const g = Math.min(255, Number(match[2])) / 255
    const b = Math.min(255, Number(match[3])) / 255

    const srgbToLinear = (v: number) =>
        v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)

    const lr = srgbToLinear(r)
    const lg = srgbToLinear(g)
    const lb = srgbToLinear(b)

    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

    const l_ = Math.cbrt(l)
    const m_ = Math.cbrt(m)
    const s_ = Math.cbrt(s)

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
    const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

    const C = Math.sqrt(a * a + b2 * b2)
    let H = Math.atan2(b2, a) * (180 / Math.PI)

    if (H < 0) H += 360

    return `${(L * 100).toFixed(2)}% ${C.toFixed(3)} ${H.toFixed(2)}`
}

const fromObjectToString = (list: BooleanMap, sortOrder: string[]) => {
    return sortOrder.filter((key) => Boolean(list[key])).join(", ")
}

const toMetadataObject = (items?: MetadataItem[]): Metadata | null => {
    if (!items?.length) return null

    const result: Metadata = {}

    for (const { key, value } of items) {
        const normalizedKey = key?.trim()
        if (!normalizedKey) continue
        result[normalizedKey] = value ?? ""
    }

    return Object.keys(result).length > 0 ? result : null
}

function toAttributeValue(value: string) {
    const normalizedValue = value?.trim()
    return normalizedValue || undefined
}

function toBooleanAttribute(value: boolean) {
    if (value === undefined) return false
    return String(value)
}

function normalizeFieldName(fieldName: string) {
    return fieldName.trim() || "uploadcare_files"
}

// ─── Order ─────────────────────────────
const SOURCES_ORDER = [
    "local",
    "dropbox",
    "gdrive",
    "gphotos",
    "box",
    "onedrive",
]

// ─── Initialize Uploadcare by loading its core bundle for the file uploader. ─────────────────────────────
let uploadcareModule: UploadcareModule | null = null
let uploadcareLoader: Promise<UploadcareModule> | null = null
let uploadcareStylesLoader: Promise<void> | null = null

function areUploadcareElementsDefined() {
    if (typeof customElements === "undefined") return false
    return Boolean(
        customElements.get("uc-config") &&
            (customElements.get("uc-file-uploader-regular") ||
                customElements.get("uc-file-uploader-minimal") ||
                customElements.get("uc-file-uploader-inline"))
    )
}

function loadUploadcare(): Promise<UploadcareModule> {
    if (uploadcareModule) return Promise.resolve(uploadcareModule)
    if (typeof window === "undefined")
        return Promise.reject(
            new Error("Uploadcare can only load in the browser.")
        )
    if (typeof document === "undefined")
        return Promise.reject(
            new Error("Uploadcare can only load in the browser.")
        )
    if (typeof HTMLElement === "undefined")
        return Promise.reject(
            new Error("Uploadcare can only load in the browser.")
        )

    if (uploadcareLoader) return uploadcareLoader

    uploadcareLoader = UC_BUNDLE_JS.then((module) => {
        const loadedModule = module
        if (!areUploadcareElementsDefined()) {
            loadedModule.defineComponents(loadedModule)
        }
        uploadcareModule = loadedModule
        return loadedModule
    }).catch((error) => {
        uploadcareLoader = null
        throw error instanceof Error ? error : new Error(String(error))
    })

    return uploadcareLoader
}

// ─── Ensure Uploadcare base styles are loaded and applied only once. ─────────────────────────────
function ensureUploadcareStyles(): Promise<void> {
    if (typeof document === "undefined") return Promise.resolve()
    if (document.getElementById(UC_STYLES_ID)) return Promise.resolve()
    if (uploadcareStylesLoader) return uploadcareStylesLoader

    uploadcareStylesLoader = UC_BUNDLE_CSS.then((module) => {
        if (document.getElementById(UC_STYLES_ID)) return

        const style = document.createElement("style")
        style.id = UC_STYLES_ID
        style.textContent = module.default

        document.head.appendChild(style)
    }).catch((error) => {
        uploadcareStylesLoader = null
        throw error instanceof Error ? error : new Error(String(error))
    })

    return uploadcareStylesLoader
}

// ─── Sub component ─────────────────────────────

function Placeholder({
    title,
    message,
    variant = "info",
}: {
    title: string
    message?: string
    variant?: "info" | "error"
}) {
    const isError = variant === "error"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 96,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: 16,
                borderRadius: 8,
                border: `1.5px dashed ${isError ? "#f87171" : "rgba(136, 136, 136, 0.45)"}`,
                background: isError
                    ? "rgba(239, 68, 68, 0.06)"
                    : "rgba(128, 128, 128, 0.06)",
                boxSizing: "border-box",
                color: isError ? "#dc2626" : "#555",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                textAlign: "center",
            }}
        >
            <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
            {message && (
                <span style={{ maxWidth: 320, fontSize: 12, lineHeight: 1.4 }}>
                    {message}
                </span>
            )}
        </div>
    )
}
// ─── App component ─────────────────────────────

/**
 * Uploadcare Form Uploader
 *
 * Drop this inside a Framer Form. It renders Uploadcare's uploader and a
 * native form output element so uploaded file URLs are included on submit.
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function FileUploaderWidget(props: FileUploaderWidget) {
    const {
        mode,
        classWrapper,
        colors,
        fieldName,
        theme,
        pubkey,
        multiple,
        multipleMin,
        multipleMax,
        confirmUpload,
        imgOnly,
        accept,
        store,
        groupOutput,
        filesViewMode,
        gridShowFileNames,
        pasteScope,
        metadata,
        dynamicButton,
        dynamicButtonViewMode,
        sourceList,
    } = props

    const [ready, setReady] = useState(false)
    const [loadError, setLoadError] = useState<Error | null>(null)
    const configRef = useRef<UploadcareConfigElement | null>(null)
    const generatedId = useId()

    // useIsStaticRenderer() is true for both the interactive canvas AND the export/thumbnail static renderer.
    const isStaticRenderer = useIsStaticRenderer()

    const ctxName = useMemo(
        () => normalizeFieldName(fieldName || generatedId),
        [fieldName, generatedId]
    )

    useEffect(() => {
        if (isStaticRenderer) return

        let isMounted = true

        Promise.all([ensureUploadcareStyles(), loadUploadcare()])
            .then(() => {
                if (!isMounted) return
            })
            .then(() => {
                if (isMounted) setReady(true)
            })
            .catch((error) => {
                if (!isMounted) return
                setLoadError(
                    error instanceof Error ? error : new Error(String(error))
                )
            })

        return () => {
            isMounted = false
        }
    }, [isStaticRenderer])

    useEffect(() => {
        if (!configRef.current) return
        configRef.current.metadata = () => toMetadataObject(metadata)
    }, [metadata])

    const configProps = useMemo(
        () => ({
            "ctx-name": ctxName,
            pubkey: pubkey,
            multiple: toBooleanAttribute(multiple),
            "multiple-min":
                multiple && multipleMin > 0 ? multipleMin : undefined,
            "multiple-max": multiple ? multipleMax : undefined,
            "confirm-upload": toBooleanAttribute(confirmUpload),
            "img-only": toBooleanAttribute(imgOnly),
            accept: toAttributeValue(accept),
            store: String(store),
            "group-output": toBooleanAttribute(groupOutput),
            "source-list": fromObjectToString(sourceList, SOURCES_ORDER),
            "files-view-mode": filesViewMode,
            "grid-show-file-names": toBooleanAttribute(gridShowFileNames),
            "paste-scope": pasteScope,
            "user-agent-integration": "Framer/1.0.0",
            "dynamic-button-view-mode": dynamicButton
                ? dynamicButtonViewMode
                : undefined,
        }),
        [
            ctxName,
            pubkey,
            multiple,
            multipleMin,
            multipleMax,
            confirmUpload,
            imgOnly,
            accept,
            store,
            sourceList,
            groupOutput,
            filesViewMode,
            gridShowFileNames,
            pasteScope,
            dynamicButton,
            dynamicButtonViewMode,
        ]
    )

    const uploaderStyle = useMemo(
        () =>
            theme === "custom"
                ? ({
                      "--uc-primary-oklch-light": rgbToOklch(colors?.light),
                      "--uc-primary-oklch-dark": rgbToOklch(colors?.dark),
                  } as CSSProperties)
                : null,
        [colors.dark, colors.light, theme]
    )

    const themeClassName = useMemo(() => {
        if (theme === "dark") return "uc-dark"
        if (theme === "light") return "uc-light"
        return ""
    }, [theme])

    if (isStaticRenderer) {
        return (
            <Placeholder
                title="Uploadcare File Uploader"
                message="Preview or publish your site to use the uploader."
            />
        )
    }

    if (!pubkey) {
        return (
            <Placeholder
                title="Public Key Required"
                message="Open the properties panel and enter your Uploadcare Public Key to enable the file uploader."
            />
        )
    }

    if (!ready) {
        if (loadError) {
            return (
                <Placeholder
                    title="Failed To Load Uploadcare"
                    message={loadError.message}
                    variant="error"
                />
            )
        }

        return <Placeholder title="Loading Uploadcare" />
    }

    return (
        <div className={classWrapper}>
            {ready && (
                <>
                    {createElement("uc-config", {
                        key: `config-${ctxName}`,
                        ref: configRef,
                        ...configProps,
                    })}
                    {createElement(
                        `uc-file-uploader-${mode}`,
                        {
                            key: `uploader-${ctxName}-${mode}`,
                            "ctx-name": ctxName,
                            class: themeClassName,
                            ...{ style: uploaderStyle },
                            ...(dynamicButton ? { "dynamic-button": "" } : {}),
                        },
                        createElement("uc-form-input", {
                            "ctx-name": ctxName,
                        })
                    )}
                    {createElement("uc-upload-ctx-provider", {
                        key: `provider-${ctxName}`,
                        "ctx-name": ctxName,
                    })}
                </>
            )}
        </div>
    )
}

FileUploaderWidget.defaultProps = {
    mode: "regular",
    theme: "auto",
    colors: {
        light: "#157cfc",
        dark: "#5b9dff",
    },
    fieldName: "",

    pubkey: "",
    multiple: true,
    multipleMin: 0,
    multipleMax: 10,

    confirmUpload: false,
    imgOnly: false,
    accept: "",
    store: "auto",
    groupOutput: false,

    sourceList: {
        local: true,
        dropbox: false,
        gdrive: false,
        gphotos: false,
        box: false,
        onedrive: false,
    },

    filesViewMode: "list",
    gridShowFileNames: false,

    pasteScope: "local",
    dynamicButton: false,
}

addPropertyControls(FileUploaderWidget, {
    pubkey: {
        type: ControlType.String,
        title: "Public Key",
        placeholder: "Your public key",
        description:
            "Your Uploadcare project public key. Get it from the [Dashboard](https://app.uploadcare.com).",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["regular", "inline", "minimal"],
        optionTitles: ["Regular", "Inline", "Minimal"],
        description:
            "Regular shows a button that opens a modal. Inline embeds the uploader directly on the page. Minimal shows only a compact upload button.",
    },
    dynamicButton: {
        type: ControlType.Boolean,
        title: "Dynamic button",
        defaultValue: false,
        hidden: (props) => props.mode !== "regular",
    },
    dynamicButtonViewMode: {
        type: ControlType.Enum,
        title: "Dynamic button view",
        description: "Controls how source actions are displayed.",
        options: ["auto", "menu", "toolbar", "compact"],
        optionTitles: ["Auto", "Menu", "Toolbar", "Compact"],
        hidden: (props) => props.mode !== "regular" || !props.dynamicButton,
    },
    classWrapper: {
        type: ControlType.String,
        title: "Wrapper class",
        defaultValue: "uc-file-uploader-wrapper",
    },
    fieldName: {
        type: ControlType.String,
        defaultValue: "files",
        title: "Field Name",
        description:
            "HTML form field name used when the uploader is placed inside a <form> element.",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["auto", "light", "dark", "custom"],
        optionTitles: ["Auto", "Light", "Dark", "Custom"],
        description:
            "Color theme for the uploader UI. Auto follows the user's system preference.",
    },
    colors: {
        type: ControlType.Object,
        title: "Color",
        description:
            "Set the primary accent colors for the custom theme. These colors are applied to the uploader interface in light and dark modes.",
        controls: {
            light: {
                type: ControlType.Color,
                title: "Light",
            },
            dark: {
                type: ControlType.Color,
                title: "Dark",
            },
        },
        hidden: (props) => props.theme !== "custom",
    },

    // Sources
    sourceList: {
        type: ControlType.Object,
        title: "Sources",
        description:
            "Enable or disable the file sources shown in the uploader.",
        controls: {
            local: { type: ControlType.Boolean, title: "Local" },
            dropbox: { type: ControlType.Boolean, title: "Dropbox" },
            gdrive: { type: ControlType.Boolean, title: "Google Drive" },
            gphotos: { type: ControlType.Boolean, title: "Google Photos" },
            box: { type: ControlType.Boolean, title: "Box" },
            onedrive: { type: ControlType.Boolean, title: "OneDrive" },
        },
    },

    // Files
    multiple: {
        type: ControlType.Boolean,
        title: "Multiple Files",
        description:
            "Allow users to select and upload more than one file at a time.",
    },
    multipleMin: {
        type: ControlType.Number,
        title: "Min Files",
        min: 0,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.multiple,
        description:
            "Minimum number of files required before the upload can be confirmed.",
    },
    multipleMax: {
        type: ControlType.Number,
        title: "Max Files",
        min: 1,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.multiple,
        description:
            "Maximum number of files a user can select in one session.",
    },
    confirmUpload: {
        type: ControlType.Boolean,
        title: "Confirm Upload",
        description:
            "Show a confirmation step after files are selected, letting the user review before uploading starts.",
    },
    imgOnly: {
        type: ControlType.Boolean,
        title: "Images Only",
        description:
            "Restrict uploads to image files. Non-image files will be rejected.",
    },
    accept: {
        type: ControlType.String,
        title: "Accept",
        placeholder: "image/*, .pdf",
        description:
            "Comma-separated list of allowed MIME types or file extensions, e.g. image/*, .pdf.",
    },
    store: {
        type: ControlType.Enum,
        title: "Store",
        options: ["auto", "true", "false"],
        optionTitles: ["Auto", "Yes", "No"],
        defaultValue: "auto",
        description:
            "Whether to store uploaded files. See [docs](https://uploadcare.com/docs/uploads/storage/).",
    },
    groupOutput: {
        type: ControlType.Boolean,
        title: "Group Output",
        description:
            "Combine multiple uploaded files into a single group URL instead of returning individual file URLs.",
    },
    metadata: {
        title: "Metadata",
        type: ControlType.Array,
        description:
            "Key-value pairs attached to every uploaded file. Keys must contain only alphanumeric characters and dashes. Accessible via the Uploadcare API after upload. See [docs](https://uploadcare.com/docs/file-uploader/options/#metadata).",
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                key: {
                    type: ControlType.String,
                    title: "Key",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                },
            },
        },
    },

    filesViewMode: {
        type: ControlType.Enum,
        title: "Files View",
        options: ["list", "grid"],
        optionTitles: ["List", "Grid"],
        description:
            "Layout of the uploaded files list. List shows files in a column; Grid arranges them as tiles.",
    },
    gridShowFileNames: {
        type: ControlType.Boolean,
        title: "Show File Names",
        hidden: (props) => props.filesViewMode !== "grid",
        description: "Display file names below thumbnails in grid view mode.",
    },
    pasteScope: {
        type: ControlType.Enum,
        title: "Paste Scope",
        options: ["local", "global", "false"],
        optionTitles: ["Local", "Global", "Disabled"],
        description:
            "Controls where Ctrl/Cmd+V paste-to-upload is active. Local captures paste only when the uploader is focused; Global captures it anywhere on the page.",
    },
})
