import { renderHTML, renderStyle } from './web-component-render.js'

export default function WebComponentSSR(params) {
  const { html, state } = params;

  console.log(params);

  return html`
    ${renderStyle()}
    ${renderHTML(state)}
    <p>** SSR rendered web-component **</p>

    <script defer type=module>
      import { WebComponent } from './web-components/web-component.js'
    </script>
  `;
}