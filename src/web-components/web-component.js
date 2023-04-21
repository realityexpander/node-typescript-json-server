import { renderHTML, renderStyle } from './web-component-render.js'

export class WebComponent extends HTMLElement {
  #params = null;
  #prevSlotContent = null;

  constructor() {
    super()

    this.#params = this.getAttribute("params");

    // Save the <slot> content from the SSR render on the server
    this.#prevSlotContent = this.querySelector("slot")?.innerHTML;
  }

  /**
   * @param {null} params
   */
  set params(params) {
    this.#params = params
  }

  simulateLoading() {
    setTimeout(() => {
      // remove the "ssr_*" classes that were added by the server
      // search for all classes that start with "ssr_" and remove them
      const classes = this.className.split(" ")
      const newClasses = classes.filter((c) => !c.startsWith("ssr_"))
      this.className = newClasses.join(" ")

      this.render()
    }, 2000)
  }

  connectedCallback() {
    console.log("connectedCallback")

    // find the <slot> content
    // const #prevSlot = this.querySelector("slot").innerHTML

    this.simulateLoading()
  }

  render() {
    // this.innerHTML = renderHTML(this.#params)
    // this.innerHTML = '';
    // this.innerHtml = renderStyle() +
    // return renderStyle() +
    // this.innerHTML = renderHTML(this.#params) +
    this.innerHTML = renderHTML(this.#params, this.#prevSlotContent) +
      "<p>web-component rendered</p>"
  }
}
customElements.define('web-component', WebComponent)
