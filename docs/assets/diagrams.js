/* Floc docs — mermaid init + a small pan/zoom/expand viewer.
 *
 * Loaded after assets/vendor/mermaid.min.js on the pages that carry diagrams.
 * Renders every <pre class="mermaid">, then wraps each result in a stage the
 * reader can drag, zoom, and blow up to full screen — the ERD in particular is
 * unreadable at page width.
 *
 * Controls: drag to pan · ctrl/⌘+wheel to zoom · double-click to expand ·
 * +/−/0 and Esc while a diagram has focus.
 *
 * No dependencies beyond mermaid itself, and no fetch — this has to run from
 * the file:// origin.
 */

(function () {
  // The ERD is ~7800px wide, so "fit to width" lands around 8% — the floor has
  // to sit below that or fit silently overflows.
  var MIN = 0.04;
  var MAX = 8;

  if (!window.mermaid) {
    // Vendored mermaid missing — show the source rather than a blank gap.
    document.querySelectorAll('pre.mermaid').forEach(function (el) {
      el.style.visibility = 'visible';
      var note = document.createElement('p');
      note.className = 'mermaid-fallback';
      note.textContent =
        'Diagram not rendered: assets/vendor/mermaid.min.js did not load. ' +
        'The diagram source is shown below.';
      el.parentNode.insertBefore(note, el);
    });
    return;
  }

  // Mermaid paints hex into the SVG, so it takes the resolved values from docs.css.
  function token(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'strict',
    fontFamily: token('--sans'),
    maxTextSize: 200000,
    themeVariables: {
      background: token('--sheet'),
      primaryColor: token('--sheet'),
      primaryTextColor: token('--ink'),
      primaryBorderColor: token('--pen'),
      lineColor: token('--ink-3'),
      secondaryColor: token('--pen-2'),
      tertiaryColor: token('--sheet-2')
    }
  });

  function button(act, label, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'diagram-btn';
    b.dataset.act = act;
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    return b;
  }

  function enhance(pre) {
    var svg = pre.querySelector('svg');
    if (!svg) return;

    // Mermaid caps the svg to the container width and drops an explicit height;
    // both fight the transform, so take them back.
    svg.style.maxWidth = 'none';
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    var box = svg.viewBox && svg.viewBox.baseVal;
    var natW = (box && box.width) || svg.getBoundingClientRect().width || 800;
    var natH = (box && box.height) || svg.getBoundingClientRect().height || 600;
    svg.style.width = natW + 'px';
    svg.style.height = natH + 'px';

    var fig = document.createElement('figure');
    fig.className = 'diagram';
    fig.tabIndex = 0;

    var stage = document.createElement('div');
    stage.className = 'diagram-stage';

    var canvas = document.createElement('div');
    canvas.className = 'diagram-canvas';

    pre.parentNode.insertBefore(fig, pre);
    canvas.appendChild(pre);
    stage.appendChild(canvas);
    fig.appendChild(stage);

    var bar = document.createElement('div');
    bar.className = 'diagram-bar';
    var pct = document.createElement('span');
    pct.className = 'diagram-zoom';
    bar.appendChild(button('out', '−', 'Zoom out'));
    bar.appendChild(pct);
    bar.appendChild(button('in', '+', 'Zoom in'));
    bar.appendChild(button('fit', 'Fit', 'Fit to width'));
    bar.appendChild(button('reset', '1:1', 'Actual size'));
    var expand = button('full', 'Expand', 'Expand to full screen');
    bar.appendChild(expand);
    fig.appendChild(bar);

    var hint = document.createElement('p');
    hint.className = 'diagram-hint';
    hint.textContent = 'Drag to pan · ctrl+scroll to zoom · double-click to expand';
    fig.appendChild(hint);

    var s = 1, tx = 0, ty = 0;
    // While true the diagram re-fits whenever the stage resizes (expanding,
    // window resize, late font metrics). Any manual zoom or pan turns it off,
    // so the reader's own framing is never yanked out from under them.
    var autoFit = true;

    function apply() {
      canvas.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
      pct.textContent = Math.round(s * 100) + '%';
    }

    function clamp(v) { return Math.max(MIN, Math.min(MAX, v)); }

    // Zoom about a point in stage coordinates, so the thing under the cursor
    // stays under the cursor.
    function zoomAt(next, px, py) {
      next = clamp(next);
      var k = next / s;
      tx = px - k * (px - tx);
      ty = py - k * (py - ty);
      s = next;
      autoFit = false;
      apply();
    }

    function centre(scale, keepAuto) {
      var r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      s = clamp(scale);
      // Centre when it fits; pin to a small margin when it overflows.
      tx = natW * s > r.width ? 12 : (r.width - natW * s) / 2;
      ty = natH * s > r.height ? 12 : (r.height - natH * s) / 2;
      autoFit = !!keepAuto;
      apply();
    }

    function fit() {
      var r = stage.getBoundingClientRect();
      var pad = 24;
      if (!r.width || !r.height) return;
      centre(Math.min((r.width - pad) / natW, (r.height - pad) / natH), true);
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.diagram-btn');
      if (!b) return;
      var r = stage.getBoundingClientRect();
      var act = b.dataset.act;
      if (act === 'in') zoomAt(s * 1.25, r.width / 2, r.height / 2);
      else if (act === 'out') zoomAt(s / 1.25, r.width / 2, r.height / 2);
      else if (act === 'fit') fit();
      else if (act === 'reset') centre(1, false);
      else if (act === 'full') toggle();
      fig.focus();
    });

    // --- drag to pan ---
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX - tx, y: e.clientY - ty, id: e.pointerId };
      autoFit = false;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('grabbing');
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      tx = e.clientX - drag.x;
      ty = e.clientY - drag.y;
      apply();
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      stage.classList.remove('grabbing');
    }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // --- wheel zoom ---
    // Plain wheel must keep scrolling the page; only modified wheel zooms,
    // except when expanded, where there is no page to scroll.
    stage.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey && !fig.classList.contains('is-full')) return;
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      zoomAt(s * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    stage.addEventListener('dblclick', function (e) {
      e.preventDefault();
      toggle();
    });

    fig.addEventListener('keydown', function (e) {
      var r = stage.getBoundingClientRect();
      if (e.key === '+' || e.key === '=') { zoomAt(s * 1.25, r.width / 2, r.height / 2); }
      else if (e.key === '-') { zoomAt(s / 1.25, r.width / 2, r.height / 2); }
      else if (e.key === '0') { fit(); }
      else if (e.key === 'Escape' && fig.classList.contains('is-full')) { toggle(); }
      else return;
      e.preventDefault();
    });

    function toggle() {
      var full = fig.classList.toggle('is-full');
      document.body.classList.toggle('diagram-open', full);
      expand.textContent = full ? 'Close' : 'Expand';
      expand.title = full ? 'Close (Esc)' : 'Expand to full screen';
      // The stage is about to change size; let the observer below do the
      // measuring once the new layout exists.
      autoFit = true;
      requestAnimationFrame(fit);
      fig.focus();
    }

    // The stage's size isn't reliable at this point — expanding, a window
    // resize, and late font metrics all change it after the fact. Re-fit
    // whenever it actually moves, unless the reader has taken over.
    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (autoFit) fit(); }).observe(stage);
    } else {
      window.addEventListener('resize', function () { if (autoFit) fit(); });
    }

    fig.addEventListener('viewer:fit', fit);
    fit();
  }

  function run() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('pre.mermaid'));
    if (!nodes.length) return;
    // Mermaid measures text, and a closed <details> measures as zero — open
    // them for the render, then close them again.
    var closed = Array.prototype.slice.call(document.querySelectorAll('details:not([open])'));
    closed.forEach(function (d) { d.open = true; });
    mermaid
      .run({ nodes: nodes })
      .then(function () {
        nodes.forEach(enhance);
        closed.forEach(function (d) { d.open = false; });
      })
      .catch(function (err) {
        // A parse error shouldn't leave the reader with an empty box.
        nodes.forEach(function (el) { el.style.visibility = 'visible'; });
        if (window.console) console.error('mermaid failed to render:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
