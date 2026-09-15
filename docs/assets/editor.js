/* Local-only doc annotations. Requires blocks marked with data-doc-block. */
(function () {
  'use strict';
  var page = location.pathname.replace(/\\/g, '/').split('/docs/')[1] || location.pathname;
  var key = 'floc-doc-annotations:' + page;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('[data-doc-block]'));
  if (!blocks.length) {
    document.querySelectorAll('main h1, main h2, main h3, main h4, main p, main li, main td, main blockquote, main pre').forEach(function (node, index) {
      node.dataset.docBlock = 'auto-' + index;
    });
    blocks = Array.prototype.slice.call(document.querySelectorAll('[data-doc-block]'));
  }
  // Why: a diagram's source restored from storage is its rendered svg text, which mermaid cannot parse.
  blocks = blocks.filter(function (block) { return !block.matches('pre.mermaid'); });
  var lastRange = null;
  var sourceTimer = null;
  var stored = read();
  var annotations = stored.annotations;
  blocks.forEach(function (block) { if (stored.content && typeof stored.content[block.dataset.docBlock] === 'string') block.textContent = stored.content[block.dataset.docBlock]; });

  var bar = document.createElement('div');
  bar.className = 'doc-editor-bar is-hidden';
  bar.addEventListener('mousedown', function (event) { if (event.target.closest('button')) event.preventDefault(); });
  var highlightColour = '#ffe58a';
  [['#ffe58a', 'Yellow'], ['#f5b7a5', 'Red'], ['#bfe3c8', 'Green'], ['#b9c5ff', 'Blue']].forEach(function (item) {
    var colour = document.createElement('button'); colour.type = 'button'; colour.className = 'doc-colour';
    colour.style.backgroundColor = item[0]; colour.title = item[1] + ' highlight'; colour.setAttribute('aria-label', item[1] + ' highlight');
    colour.addEventListener('click', function () { highlightColour = item[0]; bar.querySelectorAll('.doc-colour').forEach(function (b) { b.classList.remove('selected'); }); colour.classList.add('selected'); annotate('highlight'); });
    if (item[0] === highlightColour) colour.classList.add('selected'); bar.appendChild(colour);
  });
  [['bold', 'Bold', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h4.2a3 3 0 0 1 0 6H4zm0 6h4.8a3 3 0 0 1 0 6H4zM4 2.5v12"/></svg>'], ['underline', 'Underline', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2v5.2a4 4 0 0 0 8 0V2M3 14h10"/></svg>'], ['comment', 'Comment', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 0 1-8.8 4.4L2.5 13l.7-2.2A5.5 5.5 0 1 1 13.5 8Z"/></svg>'], ['clear', 'Clear formatting', '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 12 6-6 3 3-6 6H3zM8 5l2-2 3 3-2 2M2 14h12"/></svg>']].forEach(function (item) {
    var button = document.createElement('button'); button.type = 'button'; button.innerHTML = item[2]; button.title = item[1]; button.setAttribute('aria-label', item[1]);
    button.addEventListener('click', function () { annotate(item[0]); }); bar.appendChild(button);
  });
  blocks.forEach(function (block) { block.contentEditable = 'true'; block.classList.add('doc-content-editing'); block.addEventListener('input', function () { save(); queueSourceSave(); }); block.addEventListener('blur', function () { save(); }, true); });
  var saveHtml = document.createElement('button'); saveHtml.type = 'button'; saveHtml.textContent = 'Save HTML';
  saveHtml.addEventListener('click', saveSource); bar.appendChild(saveHtml);
  var reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Reset page';
  reset.addEventListener('click', function () { localStorage.removeItem(key); location.reload(); }); bar.appendChild(reset);
  var main = document.querySelector('main'); main.insertBefore(bar, main.firstChild);
  var status = document.createElement('p'); status.className = 'doc-editor-status'; main.insertBefore(status, bar.nextSibling);
  status.textContent = 'Edit mode · saved in this browser only';
  render();
  document.addEventListener('selectionchange', positionToolbar);

  function positionToolbar() {
    if (bar.classList.contains('comment-active')) return;
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) { bar.classList.add('is-hidden'); return; }
    lastRange = selection.getRangeAt(0).cloneRange();
    var node = selection.anchorNode;
    var block = node && (node.nodeType === 1 ? node.closest('[data-doc-block]') : node.parentElement.closest('[data-doc-block]'));
    if (!block || !blocks.includes(block)) { bar.classList.add('is-hidden'); return; }
    var rect = selection.getRangeAt(0).getBoundingClientRect();
    bar.classList.remove('is-hidden');
    bar.style.left = Math.max(8, Math.min(window.innerWidth - bar.offsetWidth - 8, rect.left + rect.width / 2 - bar.offsetWidth / 2)) + 'px';
    bar.style.top = Math.max(8, rect.top - bar.offsetHeight - 10) + 'px';
  }

  function annotate(type) {
    var selection = window.getSelection(); var range = lastRange; if (!range || range.collapsed) return;
    var block = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer.closest('[data-doc-block]') : range.commonAncestorContainer.parentElement.closest('[data-doc-block]');
    if (!block || !blocks.includes(block)) return;
    var start = offset(block, range.startContainer, range.startOffset), end = offset(block, range.endContainer, range.endOffset); if (start === end) return;
    if (type === 'clear') { annotations = annotations.filter(function (a) { return a.block !== block.dataset.docBlock || a.end <= start || a.start >= end; }); save(); selection.removeAllRanges(); lastRange = null; render(); bar.classList.add('is-hidden'); return; }
    if (type === 'highlight') annotations = annotations.filter(function (a) { return a.type !== 'highlight' || a.block !== block.dataset.docBlock || a.end <= start || a.start >= end; });
    if (type === 'comment') { showCommentBox(block, start, end); return; }
    addAnnotation(block, start, end, type);
  }
  function addAnnotation(block, start, end, type, value) { annotations.push({ id: String(Date.now()) + Math.random(), block: block.dataset.docBlock, start: Math.min(start, end), end: Math.max(start, end), type: type, value: value, colour: type === 'highlight' ? highlightColour : undefined }); save(); window.getSelection().removeAllRanges(); lastRange = null; render(); bar.classList.remove('comment-active'); bar.classList.add('is-hidden'); }
  function showCommentBox(block, start, end) {
    bar.classList.add('comment-active');
    bar.querySelectorAll('.doc-comment-input, .doc-comment-save, .doc-comment-cancel').forEach(function (node) { node.remove(); });
    var input = document.createElement('input'); input.className = 'doc-comment-input'; input.placeholder = 'Write comment…'; input.setAttribute('aria-label', 'Comment');
    var saveButton = document.createElement('button'); saveButton.type = 'button'; saveButton.className = 'doc-comment-save'; saveButton.textContent = 'Add';
    var cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'doc-comment-cancel'; cancel.textContent = '×'; cancel.title = 'Cancel comment';
    bar.appendChild(input); bar.appendChild(saveButton); bar.appendChild(cancel); input.focus();
    saveButton.addEventListener('click', function () { if (input.value.trim()) addAnnotation(block, start, end, 'comment', input.value.trim()); });
    input.addEventListener('keydown', function (event) { if (event.key === 'Enter') saveButton.click(); if (event.key === 'Escape') cancel.click(); });
    cancel.addEventListener('click', function () { input.remove(); saveButton.remove(); cancel.remove(); bar.classList.remove('comment-active'); });
  }
  function render() {
    blocks.forEach(function (block) { block.querySelectorAll('[data-doc-annotation]').forEach(function (n) { n.replaceWith(document.createTextNode(n.textContent)); }); });
    annotations.slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (a) { var block = blocks.find(function (b) { return b.dataset.docBlock === a.block; }); if (!block) return; var r = rangeAt(block, a.start, a.end); if (!r) return; var span = document.createElement('span'); span.dataset.docAnnotation = a.id; span.className = 'doc-annotation-' + a.type; if (a.type === 'highlight' && /^#[0-9a-f]{6}$/i.test(a.colour || '')) span.style.backgroundColor = a.colour; if (a.type === 'comment') span.addEventListener('click', function (event) { event.stopPropagation(); showComment(a, span); }); try { r.surroundContents(span); } catch (_) {} });
  }
  function showComment(annotation, anchor) { document.querySelectorAll('.doc-comment-popover').forEach(function (n) { n.remove(); }); var pop = document.createElement('div'); pop.className = 'doc-comment-popover'; var text = document.createElement('div'); text.textContent = annotation.value; pop.appendChild(text); var actions = document.createElement('div'); actions.className = 'doc-comment-actions'; var resolve = document.createElement('button'); resolve.type = 'button'; resolve.className = 'doc-comment-resolve'; resolve.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>'; resolve.title = 'Resolve comment'; resolve.setAttribute('aria-label', 'Resolve comment'); var close = document.createElement('button'); close.type = 'button'; close.className = 'doc-comment-close'; close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>'; close.title = 'Close comment'; close.setAttribute('aria-label', 'Close comment'); resolve.addEventListener('click', function () { annotations = annotations.filter(function (a) { return a.id !== annotation.id; }); save(); pop.remove(); render(); }); close.addEventListener('click', function () { pop.remove(); }); actions.appendChild(resolve); actions.appendChild(close); pop.appendChild(actions); document.body.appendChild(pop); var rect = anchor.getBoundingClientRect(); pop.style.left = Math.max(8, rect.left) + 'px'; pop.style.top = Math.min(window.innerHeight - pop.offsetHeight - 8, rect.bottom + 8) + 'px'; }
  function read() { try { var value = JSON.parse(localStorage.getItem(key) || '{}'); return Array.isArray(value) ? { annotations: value, content: {} } : { annotations: Array.isArray(value.annotations) ? value.annotations : [], content: value.content || {} }; } catch (_) { return { annotations: [], content: {} }; } }
  function save() { var content = {}; blocks.forEach(function (block) { content[block.dataset.docBlock] = block.textContent; }); localStorage.setItem(key, JSON.stringify({ annotations: annotations, content: content })); }
  async function saveSource() { var clone = document.documentElement.cloneNode(true); var sidebar = clone.querySelector('#sidebar'); if (sidebar) sidebar.innerHTML = ''; clone.querySelectorAll('.doc-editor-bar, .doc-editor-status, [data-doc-annotation]').forEach(function (node) { if (node.matches('[data-doc-annotation]')) node.replaceWith(document.createTextNode(node.textContent)); else node.remove(); }); clone.querySelectorAll('[contenteditable]').forEach(function (node) { node.removeAttribute('contenteditable'); node.classList.remove('doc-content-editing'); }); var response; try { response = await fetch('/__docs/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: '/' + (location.pathname.split('/docs/')[1] || location.pathname.replace(new RegExp('^/'), '')), html: '<!doctype html>\n' + clone.outerHTML }) }); } catch (_) { status.textContent = 'Save failed — start with pnpm docs:dev'; return; } if (response.ok) status.textContent = 'HTML saved'; else status.textContent = 'Save failed'; }
  function queueSourceSave() { if (sourceTimer) clearTimeout(sourceTimer); status.textContent = 'Saving HTML…'; sourceTimer = setTimeout(function () { void saveSource(); }, 700); }
  function offset(root, node, at) { var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, total = 0; while ((n = w.nextNode())) { if (n === node) return total + at; total += n.nodeValue.length; } return total; }
  function rangeAt(root, start, end) { var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, total = 0, s, e; while ((n = w.nextNode())) { var next = total + n.nodeValue.length; if (!s && start >= total && start <= next) s = [n, start - total]; if (!e && end >= total && end <= next) { e = [n, end - total]; break; } total = next; } if (!s || !e) return null; var r = document.createRange(); r.setStart(s[0], s[1]); r.setEnd(e[0], e[1]); return r; }
})();
