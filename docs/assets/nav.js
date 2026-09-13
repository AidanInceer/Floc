/* Floc docs — sidebar renderer.
 *
 * There is no build step. This file IS the doc index: adding a page means
 * adding a line to TREE below. Every doc page loads it with a plain
 * <script src> (not fetch, which the file:// origin blocks) and gets the
 * sidebar rendered into #sidebar.
 *
 * Each page carries two attributes on <body>:
 *   data-root  — relative path back up to docs/  (".", "..")
 *   data-page  — this page's id, matching an entry's `id` below
 */

(function () {
  var TREE = [
    { id: 'index', label: 'Overview', href: 'index.html' },
    { id: 'vocab', label: 'Vocabulary', href: 'vocab.html' },
    {
      label: 'Architecture',
      children: [
        { id: 'architecture', label: 'Architecture', href: 'architecture/architecture.html' },
        { id: 'multi-platform', label: 'Web, iOS and Android', href: 'architecture/multi-platform.html' },
        { id: 'notifications', label: 'Notifications', href: 'architecture/notifications.html' },
        { id: 'ci', label: 'CI', href: 'architecture/ci.html' }
      ]
    },
    {
      label: 'Design',
      children: [
        { id: 'design-approach', label: 'Design approach', href: 'design/approach.html' },
        { id: 'visual-language', label: 'Visual language', href: 'design/visual-language.html' }
      ]
    },
    {
      label: 'Monetisation',
      children: [
        { id: 'monetisation', label: 'How this makes money', href: 'monetisation/monetisation.html' },
        { id: 'pro-tier', label: 'Pro tier', href: 'monetisation/pro-tier.html' }
      ]
    },
    { id: 'partner-trips', label: 'Partner trips', href: 'research/partner-trips.html' },
    {
      label: 'Data model',
      children: [
        { id: 'erd', label: 'ERD', href: 'data-model/erd.html' }
      ]
    },
    {
      label: 'Competitors',
      children: [
        { id: 'competitor-summary', label: 'Summary', href: 'competitors/competitor-summary.html' },
        { id: 'competitor-polarsteps', label: 'Polarsteps', href: 'competitors/competitor-polarsteps.html' },
        { id: 'competitor-splitwise', label: 'Splitwise', href: 'competitors/competitor-splitwise.html' },
        { id: 'competitor-tripit', label: 'TripIt', href: 'competitors/competitor-tripit.html' },
        { id: 'competitor-wanderlog', label: 'Wanderlog', href: 'competitors/competitor-wanderlog.html' },
        { id: 'competitor-wanderlust', label: 'Wanderlust', href: 'competitors/competitor-wanderlust.html' }
      ]
    },
    {
      label: 'Research',
      children: [
        { id: 'listings-legal', label: 'Listings & legal', href: 'research/listings-legal.html' },
        { id: 'map-embed-options', label: 'Map embed options', href: 'research/map-embed-options.html' }
      ]
    }
  ];

  var body = document.body;
  var root = body.getAttribute('data-root') || '.';
  var current = body.getAttribute('data-page') || '';
  var host = document.getElementById('sidebar');
  if (!host) return;

  function url(href) {
    return root === '.' ? href : root + '/' + href;
  }

  function link(entry) {
    var a = document.createElement('a');
    a.className = 'doc' + (entry.external ? ' external' : '');
    a.href = url(entry.href);
    a.textContent = entry.label;
    if (entry.external) a.target = '_blank';
    if (entry.id && entry.id === current) {
      a.className += ' active';
      a.setAttribute('aria-current', 'page');
    }
    var li = document.createElement('li');
    li.appendChild(a);
    return li;
  }

  // Brand block, doubling as the link home.
  var brand = document.createElement('a');
  brand.className = 'brand';
  brand.href = url('index.html');
  brand.innerHTML =
    '<svg viewBox="0 0 26 20" width="25" height="20" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 14 6.5 10.5 10 14"/><path d="M9.5 8.5 13 5 16.5 8.5"/>' +
    '<path d="M16 14 19.5 10.5 23 14"/></svg>' +
    '<span class="brand-text"><b>floc<i>.</i></b><span>Documentation</span></span>';
  host.appendChild(brand);

  var filter = document.createElement('input');
  filter.className = 'filter';
  filter.type = 'search';
  filter.placeholder = 'Filter pages…';
  filter.setAttribute('aria-label', 'Filter pages');
  host.appendChild(filter);

  var topList = document.createElement('ul');
  host.appendChild(topList);

  TREE.forEach(function (entry) {
    if (!entry.children) {
      topList.appendChild(link(entry));
      return;
    }
    var li = document.createElement('li');
    var group = document.createElement('details');
    group.className = 'group';
    var summary = document.createElement('summary');
    summary.textContent = entry.label;
    group.appendChild(summary);
    var sub = document.createElement('ul');
    var holdsCurrent = false;
    entry.children.forEach(function (child) {
      if (child.id && child.id === current) holdsCurrent = true;
      sub.appendChild(link(child));
    });
    // Open the folder the reader is standing in; leave the rest collapsed.
    group.open = holdsCurrent;
    group.appendChild(sub);
    li.appendChild(group);
    topList.appendChild(li);
  });

  var empty = document.createElement('p');
  empty.className = 'empty';
  empty.textContent = 'No matching pages.';
  empty.hidden = true;
  host.appendChild(empty);

  filter.addEventListener('input', function () {
    var q = filter.value.trim().toLowerCase();
    var hits = 0;
    Array.prototype.forEach.call(topList.children, function (li) {
      var group = li.querySelector('details');
      if (!group) {
        var show = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.classList.toggle('hidden', !show);
        if (show) hits++;
        return;
      }
      var kept = 0;
      Array.prototype.forEach.call(group.querySelectorAll('li'), function (child) {
        var show = !q || child.textContent.toLowerCase().indexOf(q) !== -1;
        child.classList.toggle('hidden', !show);
        if (show) kept++;
      });
      li.classList.toggle('hidden', kept === 0);
      hits += kept;
      // While filtering, expand whatever still has hits; restore on clear.
      if (q) group.open = kept > 0;
      else group.open = !!group.querySelector('a.active');
    });
    empty.hidden = hits > 0;
  });
})();
