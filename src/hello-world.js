// export default function HelloWorld({ html, state }) {

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default function HelloWorld({ html, state }) {
  const { attrs } = state;
  const { greeting = "Hello World" } = attrs;
  return html`
    <style scope="global">
      h1 {
        color: red;
      }
    </style>
    <h1>${greeting}</h1>
    <slot>default text</slot>
  `;
}

//<style scope="component">
//  :hosth1 {
//    color: red;
//  }
//</style>