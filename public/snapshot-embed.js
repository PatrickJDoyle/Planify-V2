/**
 * Planify Feasibility Snapshot — web component loader.
 * Usage:
 *   <script src="https://<your-app>/snapshot-embed.js"></script>
 *   <planify-snapshot base-url="https://<your-app>"></planify-snapshot>
 */
(function () {
  if (typeof customElements === 'undefined') return;
  if (customElements.get('planify-snapshot')) return;

  class PlanifySnapshotElement extends HTMLElement {
    connectedCallback() {
      const baseUrl = this.getAttribute('base-url') || 'https://app.planify.ie';
      const shadow = this.attachShadow({ mode: 'open' });
      const iframe = document.createElement('iframe');
      iframe.src = baseUrl.replace(/\/$/, '') + '/snapshot';
      iframe.style.cssText = [
        'border: none',
        'width: 100%',
        'min-width: 320px',
        'height: 620px',
        'border-radius: 12px',
        'overflow: hidden',
      ].join(';');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('title', 'Planify Feasibility Snapshot');
      shadow.appendChild(iframe);
    }
  }

  customElements.define('planify-snapshot', PlanifySnapshotElement);
})();
