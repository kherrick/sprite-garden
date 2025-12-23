export const optionTagName = "sprite-garden-option";

/**
 * Option component for Sprite Garden Select
 */
export class SpriteGardenOption extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  get value() {
    return this.getAttribute("value") || "";
  }

  set value(val) {
    this.setAttribute("value", val);
  }
}

if (!globalThis.customElements?.get(optionTagName)) {
  globalThis.customElements.define(optionTagName, SpriteGardenOption);
}
