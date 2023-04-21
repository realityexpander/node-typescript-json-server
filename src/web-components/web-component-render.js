export function renderHTML(state, slot) {
  return `
  <h1>WebComponent</h1>
  <p>state=${JSON.stringify(state)}</p>
  <slot id="main">${slot ?? ''}</slot>
  <button>Click Me</button>
  `
}

export function renderStyle() {
  return `
    <style scope="component">
      :host {
        display: block;
        color: green;
      }
    </style>
  `;
}