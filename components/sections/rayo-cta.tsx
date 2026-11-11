// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect } from "react"

const CSS = ["https://files.catbox.moe/pyqsuy.css","https://files.catbox.moe/oi3ho6.css","https://files.catbox.moe/kanktg.css"]
const JS = ["https://files.catbox.moe/apylxz.js","https://files.catbox.moe/kwp13q.js"]

const HTML = `<div class="mxd-section overflow-hidden">
  <div class="mxd-container">
    <div class="mxd-block">
      <div class="mxd-promo">
        <div class="mxd-promo__inner anim-zoom-out-container">
          <div class="mxd-promo__bg"></div>
          <div class="mxd-promo__content">
            <p class="mxd-promo__title anim-uni-in-up">
              <span class="mxd-promo__icon">
                <img src="https://picsum.photos/seed/ctaicon/100/100" alt="Icon">
              </span>
              <span class="mxd-promo__caption reveal-type">Let's talk about your project!</span>
            </p>
            <div class="mxd-promo__controls anim-uni-in-up">
              <a class="btn btn-anim btn-default btn-large btn-additional slide-right-up" href="contact.html">
                <span class="btn-caption">Contact Us</span>
                <i class="ph-bold ph-arrow-up-right"></i>
              </a>
            </div>
          </div>
          <div class="mxd-promo__images">
            <img class="promo-image promo-image-1" src="https://picsum.photos/seed/ctapromo/600/600" alt="Image">
            <img class="promo-image promo-image-2" src="https://picsum.photos/seed/ctasmall/300/300" alt="Image">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`

function injectAssets() {
    if (typeof document === "undefined") return
    CSS.forEach((href, i) => {
        const id = "rayo-css-" + i
        if (!document.getElementById(id)) {
            const l = document.createElement("link")
            l.id = id; l.rel = "stylesheet"; l.href = href
            document.head.appendChild(l)
        }
    })
    JS.forEach((src, i) => {
        const id = "rayo-js-" + i
        if (!document.getElementById(id)) {
            const s = document.createElement("script")
            s.id = id; s.src = src; s.defer = true
            document.body.appendChild(s)
        }
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function Rayo10Cta(props) {
    useEffect(() => { injectAssets() }, [])
    return (
        <div
            style={{ width: "100%" }}
            dangerouslySetInnerHTML={{ __html: HTML }}
        />
    )
}

Rayo10Cta.displayName = "Rayo10Cta"

addPropertyControls(Rayo10Cta, {})
