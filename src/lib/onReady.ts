/**
 * Run a per-page initializer for progressive-enhancement scripts.
 *
 * Why not bare `astro:page-load`? That event is dispatched by Astro's
 * ClientRouter (View Transitions) — this starter ships without one, so the
 * event never fires and a listener-only script never runs. This helper runs
 * the initializer as soon as the DOM is ready AND re-runs it after every
 * `astro:page-load` if a ClientRouter is ever added.
 *
 * The per-<body> marker prevents a double run on the initial load when a
 * router IS present (both DOMContentLoaded and astro:page-load fire); a View
 * Transitions swap replaces <body>, which resets the marker so the new page
 * initializes correctly.
 */
type MarkedBody = HTMLElement & { __hyveInit?: Set<() => void> };

export function onReady(init: () => void): void {
  const run = () => {
    const body = document.body as MarkedBody;
    body.__hyveInit ??= new Set();
    if (body.__hyveInit.has(init)) return;
    body.__hyveInit.add(init);
    init();
  };
  document.addEventListener('astro:page-load', run);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
