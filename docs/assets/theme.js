/* Why: loaded in <head>, before the stylesheet paints, so the saved theme does
 * not flash light first. docs.css has no prefers-color-scheme block — this file
 * is the only thing that decides, and it always writes an explicit value.
 */

(function () {
  var KEY = 'floc-docs-theme';

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function system() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  apply(saved() || system());

  // Follow the system until the reader picks a side.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (!saved()) apply(e.matches ? 'dark' : 'light');
    });
  }

  function glyph(paths) {
    return '<svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" fill="none" ' +
      'stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
      paths + '</svg>';
  }

  var SUN = glyph('<circle cx="7" cy="7" r="2.8"/><path d="M7 1.4v1.3M7 11.3v1.3M1.4 7h1.3M11.3 7h1.3' +
    'M3 3l.9.9M10.1 10.1l.9.9M11 3l-.9.9M3.9 10.1 3 11"/>');
  var MOON = glyph('<path d="M11.4 8.4A5 5 0 0 1 5.6 2.6a5 5 0 1 0 5.8 5.8Z"/>');

  function build() {
    var host = document.getElementById('sidebar');
    var brand = host && host.querySelector('.brand');
    if (!brand) return;

    var box = document.createElement('div');
    box.className = 'theme-toggle';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Theme');

    // Why: mermaid paints token hexes into the SVG at init, so a diagram keeps
    // the old palette unless the page is read again.
    var hasDiagram = !!document.querySelector('pre.mermaid, figure.diagram');

    var buttons = [['light', 'Light', SUN], ['dark', 'Dark', MOON]].map(function (spec) {
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = spec[2] + '<span>' + spec[1] + '</span>';
      b.addEventListener('click', function () {
        try { localStorage.setItem(KEY, spec[0]); } catch (e) {}
        apply(spec[0]);
        mark();
        if (hasDiagram) location.reload();
      });
      box.appendChild(b);
      return b;
    });

    function mark() {
      var now = document.documentElement.getAttribute('data-theme');
      buttons[0].setAttribute('aria-pressed', String(now === 'light'));
      buttons[1].setAttribute('aria-pressed', String(now === 'dark'));
    }
    mark();

    brand.insertAdjacentElement('afterend', box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
