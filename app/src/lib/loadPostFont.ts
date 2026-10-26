/* Merriweather styles generated post bodies and nothing else, so it is not
   needed to paint the news feed. It used to be requested in index.html with
   an inline `onload` handler to take it off the critical path, which the
   content security policy correctly blocks (`script-src-attr 'none'`) — the
   font then never loaded at all. Injecting the stylesheet from the tabs that
   use it keeps the font off the first paint without any inline script. */

const HREF =
  'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap';

let requested = false;

export function loadPostFont(): void {
  if (requested || typeof document === 'undefined') return;
  requested = true;

  if (document.querySelector(`link[href="${HREF}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = HREF;
  document.head.appendChild(link);
}
