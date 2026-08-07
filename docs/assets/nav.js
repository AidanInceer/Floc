/* Waypoint docs — sidebar renderer.
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
    { id: 'architecture', label: 'Architecture', href: 'architecture/architecture.html' },
    {
      label: 'Design',
      children: [
        { id: 'design-approach', label: 'Design approach', href: 'design/approach.html' },
        { id: 'visual-language', label: 'Visual language', href: 'design/visual-language.html' }
      ]
    },
    { id: 'monetisation', label: 'Monetisation', href: 'monetisation/monetisation.html' },
    { id: 'partner-trips', label: 'Partner trips', href: 'research/partner-trips.html' },
    {
      label: 'Data model',
      children: [
        { id: 'erd', label: 'ERD', href: 'data-model/erd.html' }
      ]
    },
    { id: 'backlog', label: 'Backlog', href: 'backlog/backlog.html' },
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
    },
    {
      label: 'Reviews',
      children: [
        { id: 'codebase-review-2026-08-01', label: 'Codebase review — 2026-08-01', href: 'reviews/2026-08-01-codebase-review.html' }
      ]
    },
    {
      label: 'Agents',
      children: [
        { id: 'agents-domain', label: 'Domain docs', href: 'agents/domain.html' },
        { id: 'agents-issue-tracker', label: 'Issue tracker', href: 'agents/issue-tracker.html' }
      ]
    },
    {
      // Standalone wireframes. Deliberately untouched by the docs site —
      // each is a self-contained page, opened in its own tab.
      label: 'Mockups',
      children: [
        { id: 'mockups-index', label: 'Mockup index', href: 'mockups/README.md', external: true },
        { label: 'Homepage — hero A (scatter)', href: 'mockups/homepage-hero-a-scatter.html', external: true },
        { label: 'Homepage — hero B (before/after)', href: 'mockups/homepage-hero-b-beforeafter.html', external: true },
        { label: 'Homepage — hero C (outcomes)', href: 'mockups/homepage-hero-c-outcomes.html', external: true },
        { label: 'Homepage — boarding pass', href: 'mockups/homepage-g-boardingpass.html', external: true },
        { label: 'Homepage — boarding pass + post-its', href: 'mockups/homepage-j-boardingpass-postits.html', external: true },
        { label: 'Homepage — pinboard', href: 'mockups/homepage-pinboard.html', external: true },
        { label: 'Homepage — pinboard atlas', href: 'mockups/homepage-pinboard-atlas.html', external: true },
        { label: 'Homepage — pinboard map', href: 'mockups/homepage-pinboard-map.html', external: true },
        { label: 'Homepage — pinboard trailmap', href: 'mockups/homepage-pinboard-trailmap.html', external: true },
        { label: 'Overview — layout', href: 'mockups/overview-layout.html', external: true },
        { label: 'Overview — hero stage A/B/C', href: 'mockups/overview-hero-stage-abc.html', external: true },
        { label: 'App — phone home', href: 'mockups/app-phone-home.html', external: true },
        { label: 'App — phone overview', href: 'mockups/app-phone-overview.html', external: true },
        { label: 'Ideas pinboard', href: 'mockups/ideas-pinboard.html', external: true },
        { label: 'Comment threads', href: 'mockups/comment-threads.html', external: true },
        { label: 'Money split A/B/C', href: 'mockups/money-split-abc.html', external: true },
        { label: 'Route map', href: 'mockups/route-map.html', external: true },
        { label: 'Logos & wordmarks', href: 'mockups/logos.html', external: true }
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
    '<svg viewBox="0 0 120 120" width="30" height="30" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="50" fill="none" stroke="var(--pen)" stroke-width="7"/>' +
    '<path d="M38 90 C 84 78, 24 60, 64 42 C 80 35, 82 28, 78 22" fill="none" ' +
    'stroke="var(--pen)" stroke-width="7" stroke-linecap="round" stroke-dasharray="0.1 15"/>' +
    '<circle cx="38" cy="90" r="11" fill="var(--red)"/></svg>' +
    '<span class="brand-text"><b>Waypoint</b><span>Documentation</span></span>';
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
