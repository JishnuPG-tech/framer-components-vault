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

const HTML = `      <div class="mxd-section">
        <div class="mxd-hero-02 mxd-pinned-fullscreen">
          <div class="mxd-pinned-fullscreen__static hero-02-fade-out-scroll loading-wrap">
            <div class="hero-02-static__tl-trigger"></div>
            <!-- static top -->
            <div class="mxd-hero-02-static__top hero-02-static-anim-el">
              <div class="mxd-container fullwidth-container grid-container">
                <div class="container-fluid p-0">
                  <div class="row g-0">
                    <div class="col-12 col-xl-6 mxd-grid-item no-margin">
                      <div class="hero-02-static__caption loading__item">
                        <p class="t-large t-medium t-120 t-bright">Powering next gen projects.</p>
                        <p class="t-large t-medium t-120 t-muted">No creative limits.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mxd-hero-02-static__center">
              <div class="mxd-hero-02-marquee">
                <div class="mxd-hero-02-marquee__image loading__item">
                  <img class="mxd-move" src="https://picsum.photos/seed/rayohero/800/800" alt="Hero Image">
                </div>
                <div class="mxd-hero-02-marquee__line loading__item">
                  <div class="marquee marquee-left--gsap">
                    <div class="marquee__toleft">
                      <div class="marquee__item one-line item-regular text">
                        <p class="marquee__text">the power of imagination</p>
                        <div class="marquee__image">
                          <svg class="mxd-pulse" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="currentColor">
                            <path fill="currentColor" d="M78.4,38.4c0,0-11.8,0-15.8,0c-1.6,0-4.8-0.2-7.1-0.8c-2.3-0.6-4.3-0.8-6.3-2.4c-2-1.2-3.5-3.2-4.7-4.8 c-1.2-1.6-1.6-3.6-2-5.5c-0.3-1.5-0.7-4.3-0.8-5.9c-0.2-4.3,0-17.4,0-17.4C41.8,0.8,41,0,40.2,0s-1.6,0.8-1.6,1.6c0,0,0,13.1,0,17.4 c0,1.6-0.6,4.3-0.8,5.9c-0.3,2-0.8,4-2,5.5c-1.2,2-2.8,3.6-4.7,4.8s-4,1.8-6.3,2.4c-1.9,0.5-4.7,0.6-6.7,0.8c-3.9,0.4-16.6,0-16.6,0 C0.8,38.4,0,39.2,0,40c0,0.8,0.8,1.6,1.6,1.6c0,0,12.2,0,16.6,0c1.6,0,4.8,0.3,6.7,0.8c2.3,0.6,4.3,0.8,6.3,2.4 c1.6,1.2,3.2,2.8,4.3,4.4c1.2,2,2.1,3.9,2.4,6.3c0.2,1.7,0.7,4.7,0.8,6.7c0.2,4,0,16.2,0,16.2c0,0.8,0.8,1.6,1.6,1.6 s1.6-0.8,1.6-1.6c0,0,0-12.3,0-16.2c0-1.6,0.5-5.1,0.8-6.7c0.5-2.3,0.8-4.4,2.4-6.3c1.2-1.6,2.8-3.2,4.3-4.4c2-1.2,3.9-2,6.3-2.4 c1.8-0.3,5.1-0.7,7.1-0.8c3.5-0.2,15.8,0,15.8,0c0.8,0,1.6-0.8,1.6-1.6C80,39.2,79.2,38.4,78.4,38.4z"/>
                          </svg>
                        </div>
                      </div>
                      <div class="marquee__item one-line item-regular text">
                        <p class="marquee__text">the power of imagination</p>
                        <div class="marquee__image">
                          <svg class="mxd-pulse" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="currentColor">
                            <path fill="currentColor" d="M78.4,38.4c0,0-11.8,0-15.8,0c-1.6,0-4.8-0.2-7.1-0.8c-2.3-0.6-4.3-0.8-6.3-2.4c-2-1.2-3.5-3.2-4.7-4.8 c-1.2-1.6-1.6-3.6-2-5.5c-0.3-1.5-0.7-4.3-0.8-5.9c-0.2-4.3,0-17.4,0-17.4C41.8,0.8,41,0,40.2,0s-1.6,0.8-1.6,1.6c0,0,0,13.1,0,17.4 c0,1.6-0.6,4.3-0.8,5.9c-0.3,2-0.8,4-2,5.5c-1.2,2-2.8,3.6-4.7,4.8s-4,1.8-6.3,2.4c-1.9,0.5-4.7,0.6-6.7,0.8c-3.9,0.4-16.6,0-16.6,0 C0.8,38.4,0,39.2,0,40c0,0.8,0.8,1.6,1.6,1.6c0,0,12.2,0,16.6,0c1.6,0,4.8,0.3,6.7,0.8c2.3,0.6,4.3,0.8,6.3,2.4 c1.6,1.2,3.2,2.8,4.3,4.4c1.2,2,2.1,3.9,2.4,6.3c0.2,1.7,0.7,4.7,0.8,6.7c0.2,4,0,16.2,0,16.2c0,0.8,0.8,1.6,1.6,1.6 s1.6-0.8,1.6-1.6c0,0,0-12.3,0-16.2c0-1.6,0.5-5.1,0.8-6.7c0.5-2.3,0.8-4.4,2.4-6.3c1.2-1.6,2.8-3.2,4.3-4.4c2-1.2,3.9-2,6.3-2.4 c1.8-0.3,5.1-0.7,7.1-0.8c3.5-0.2,15.8,0,15.8,0c0.8,0,1.6-0.8,1.6-1.6C80,39.2,79.2,38.4,78.4,38.4z"/>
                          </svg>
                        </div>
                      </div>
                      <div class="marquee__item one-line item-regular text">
                        <p class="marquee__text">the power of imagination</p>
                        <div class="marquee__image">
                          <svg class="mxd-pulse" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" fill="currentColor">
                            <path fill="currentColor" d="M78.4,38.4c0,0-11.8,0-15.8,0c-1.6,0-4.8-0.2-7.1-0.8c-2.3-0.6-4.3-0.8-6.3-2.4c-2-1.2-3.5-3.2-4.7-4.8 c-1.2-1.6-1.6-3.6-2-5.5c-0.3-1.5-0.7-4.3-0.8-5.9c-0.2-4.3,0-17.4,0-17.4C41.8,0.8,41,0,40.2,0s-1.6,0.8-1.6,1.6c0,0,0,13.1,0,17.4 c0,1.6-0.6,4.3-0.8,5.9c-0.3,2-0.8,4-2,5.5c-1.2,2-2.8,3.6-4.7,4.8s-4,1.8-6.3,2.4c-1.9,0.5-4.7,0.6-6.7,0.8c-3.9,0.4-16.6,0-16.6,0 C0.8,38.4,0,39.2,0,40c0,0.8,0.8,1.6,1.6,1.6c0,0,12.2,0,16.6,0c1.6,0,4.8,0.3,6.7,0.8c2.3,0.6,4.3,0.8,6.3,2.4 c1.6,1.2,3.2,2.8,4.3,4.4c1.2,2,2.1,3.9,2.4,6.3c0.2,1.7,0.7,4.7,0.8,6.7c0.2,4,0,16.2,0,16.2c0,0.8,0.8,1.6,1.6,1.6 s1.6-0.8,1.6-1.6c0,0,0-12.3,0-16.2c0-1.6,0.5-5.1,0.8-6.7c0.5-2.3,0.8-4.4,2.4-6.3c1.2-1.6,2.8-3.2,4.3-4.4c2-1.2,3.9-2,6.3-2.4 c1.8-0.3,5.1-0.7,7.1-0.8c3.5-0.2,15.8,0,15.8,0c0.8,0,1.6-0.8,1.6-1.6C80,39.2,79.2,38.4,78.4,38.4z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mxd-hero-02-static__bottom hero-02-static-anim-el">
              <div class="mxd-container fullwidth-container grid-container">
                <div class="container-fluid p-0">
                  <div class="row g-0">
                    <div class="col-12 col-md-6 col-xl-4 mxd-grid-item no-margin">
                      <div class="mxd-paragraph__lists loading__fade">
                        <div class="container-fluid p-0">
                          <div class="row g-0">
                            <div class="col-6 col-xl-5">
                              <ul>
                                <li><p class="t-small anim-uni-in-up">Innovations</p></li>
                                <li><p class="t-small anim-uni-in-up">Creativity</p></li>
                                <li><p class="t-small anim-uni-in-up">Experience</p></li>
                                <li><p class="t-small anim-uni-in-up">Competence</p></li>
                                <li><p class="t-small anim-uni-in-up">Passion</p></li>
                              </ul>
                            </div>
                            <div class="col-6 col-xl-5">
                              <ul>
                                <li><p class="t-small anim-uni-in-up">IU/UX</p></li>
                                <li><p class="t-small anim-uni-in-up">App design</p></li>
                                <li><p class="t-small anim-uni-in-up">Development</p></li>
                                <li><p class="t-small anim-uni-in-up">Branding</p></li>
                                <li><p class="t-small anim-uni-in-up">Motion</p></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mxd-pinned-fullscreen__scroll">
            <div class="mxd-hero-02-scroll__wrap">
              <div class="mxd-hero-02-scroll__images">
                <div class="mxd-hero-02-images__row mxd-hero-02-images__row-01">
                  <a class="mxd-hero-02-image__portrait portrait-01" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-01 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/port1/800/1200" alt="Hero Image">
                    </div>
                  </a>
                  <a class="mxd-hero-02-image__landscape landscape-01" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-03 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/land1/1200/800" alt="Hero Image">
                    </div>
                  </a>
                  <a class="mxd-hero-02-image__portrait portrait-02" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-01 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/port2/800/1200" alt="Hero Image">
                    </div>
                  </a>
                </div>
                <div class="mxd-hero-02-images__row mxd-hero-02-images__row-02">
                  <a class="mxd-hero-02-image__landscape landscape-02" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-03 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/land2/1200/800" alt="Hero Image">
                    </div>
                  </a>
                  <a class="mxd-hero-02-image__portrait portrait-xl portrait-03" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-02 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/port3/1000/1300" alt="Hero Image">
                    </div>
                  </a>
                </div>
                <div class="mxd-hero-02-images__row mxd-hero-02-images__row-03">
                  <a class="mxd-hero-02-image__portrait portrait-04" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-01 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/port4/800/1200" alt="Hero Image">
                    </div>
                  </a>
                  <a class="mxd-hero-02-image__landscape landscape-03" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-03 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/land3/1200/800" alt="Hero Image">
                    </div>
                  </a>
                  <a class="mxd-hero-02-image__portrait portrait-05" href="project-details.html">
                    <div class="mxd-hero-02-image__inner type-01 anim-uni-in-up">
                      <img src="https://picsum.photos/seed/port5/800/1200" alt="Hero Image">
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="mxd-pinned-fullscreen__tl-trigger"></div>
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
export default function Rayo02Hero(props) {
    useEffect(() => { injectAssets() }, [])
    return (
        <div
            style={{ width: "100%" }}
            dangerouslySetInnerHTML={{ __html: HTML }}
        />
    )
}

Rayo02Hero.displayName = "Rayo02Hero"

addPropertyControls(Rayo02Hero, {})
