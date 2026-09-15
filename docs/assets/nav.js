/* Why: no build step, so TREE is the doc index. Loaded by <script src>, not fetch (file:// blocks it).
 * Each page's <body> sets data-root (path up to docs/) and data-page (an id in TREE). */

(function () {
  var TREE = [
    { id: 'index', label: 'Overview', href: 'index.html' },
    { id: 'vocab', label: 'Vocabulary', href: 'vocab.html' },
    {
      label: 'Business',
      children: [
        { id: 'pitch-deck', label: 'Investor pitch', href: 'business/pitch-deck.html' },
        { id: 'roadmap', label: 'Roadmap to full time', href: 'business/roadmap.html' }
      ]
    },
    {
      label: 'Product',
      children: [
        {
          label: 'Domains',
          children: [
            { id: 'domain-journey', label: 'User journey', href: 'product/domains/journey.html' },
            { id: 'domain-explore', label: 'Explore', href: 'product/domains/explore.html' },
            { id: 'domain-trips', label: 'Trips home', href: 'product/domains/trips.html' },
            { id: 'domain-invite', label: 'Invite', href: 'product/domains/invite.html' },
            { id: 'domain-overview', label: 'Trip overview', href: 'product/domains/overview.html' },
            { id: 'domain-dates', label: 'Dates', href: 'product/domains/dates.html' },
            { id: 'domain-days', label: 'Days', href: 'product/domains/days.html' },
            { id: 'domain-money', label: 'Money', href: 'product/domains/money.html' },
            { id: 'domain-packing', label: 'Packing', href: 'product/domains/packing.html' },
            { id: 'domain-notes', label: 'Notes', href: 'product/domains/notes.html' },
            { id: 'domain-files', label: 'Files', href: 'product/domains/files.html' }
          ]
        },
        {
          label: 'Monetisation',
          children: [
            { id: 'monetisation', label: 'How this makes money', href: 'product/monetisation/monetisation.html' },
            { id: 'pro-tier', label: 'Pro tier', href: 'product/monetisation/pro-tier.html' }
          ]
        },
        {
          label: 'Partner trips',
          children: [
            { id: 'partner-trips', label: 'Partner trips', href: 'product/partner-trips/partner-trips.html' }
          ]
        },
        {
          label: 'Competitors',
          children: [
            { id: 'competitor-summary', label: 'Summary', href: 'product/competitors/competitor-summary.html' },
            { id: 'competitor-polarsteps', label: 'Polarsteps', href: 'product/competitors/competitor-polarsteps.html' },
            { id: 'competitor-splitwise', label: 'Splitwise', href: 'product/competitors/competitor-splitwise.html' },
            { id: 'competitor-tripit', label: 'TripIt', href: 'product/competitors/competitor-tripit.html' },
            { id: 'competitor-wanderlog', label: 'Wanderlog', href: 'product/competitors/competitor-wanderlog.html' },
            { id: 'competitor-wanderlust', label: 'Wanderlust', href: 'product/competitors/competitor-wanderlust.html' },
            { id: 'competitor-tricount', label: 'Tricount', href: 'product/competitors/competitor-tricount.html' },
            { id: 'competitor-troupe', label: 'Troupe', href: 'product/competitors/competitor-troupe.html' },
            { id: 'competitor-lets-jetty', label: "Let's Jetty", href: 'product/competitors/competitor-lets-jetty.html' },
            { id: 'competitor-squadtrip', label: 'SquadTrip', href: 'product/competitors/competitor-squadtrip.html' },
            { id: 'competitor-roadtrippers', label: 'Roadtrippers', href: 'product/competitors/competitor-roadtrippers.html' },
            { id: 'competitor-stippl', label: 'Stippl', href: 'product/competitors/competitor-stippl.html' },
            { id: 'competitor-lambus', label: 'Lambus', href: 'product/competitors/competitor-lambus.html' }
          ]
        },
        {
          label: 'Research',
          children: [
            { id: 'listings-legal', label: 'Listings & legal', href: 'product/research/listings-legal.html' },
            { id: 'map-embed-options', label: 'Map embed options', href: 'product/research/map-embed-options.html' }
          ]
        }
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
      label: 'Architecture',
      children: [
        { id: 'architecture', label: 'Architecture', href: 'architecture/architecture.html' },
        { id: 'erd', label: 'Data model (ERD)', href: 'architecture/data-model/erd.html' },
        { id: 'access', label: 'Access and permissions', href: 'architecture/access.html' },
        { id: 'security', label: 'Security and privacy', href: 'architecture/security.html' },
        { id: 'api', label: 'API map', href: 'architecture/api.html' },
        { id: 'multi-platform', label: 'Web, iOS and Android', href: 'architecture/multi-platform.html' },
        { id: 'notifications', label: 'Notifications', href: 'architecture/notifications.html' },
        { id: 'ci', label: 'CI', href: 'architecture/ci.html' },
        { id: 'operations', label: 'Environments and runbook', href: 'architecture/operations.html' },
        { id: 'lifecycle', label: 'Development lifecycle', href: 'architecture/lifecycle.html' }
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
  var searchIndex = [];
  fetch((root === '.' ? '' : root) + '/__docs/search').then(function (response) { return response.ok ? response.json() : []; }).then(function (pages) { searchIndex = pages; }).catch(function () {});

  var topList = document.createElement('ul');
  host.appendChild(topList);

  function holds(entry) {
    if (entry.id === current) return true;
    return !!entry.children && entry.children.some(holds);
  }

  function node(entry) {
    if (!entry.children) return link(entry);
    var li = document.createElement('li');
    var group = document.createElement('details');
    group.className = 'group';
    var summary = document.createElement('summary');
    summary.textContent = entry.label;
    group.appendChild(summary);
    var sub = document.createElement('ul');
    entry.children.forEach(function (child) { sub.appendChild(node(child)); });
    // Open the folder the reader is standing in; leave the rest collapsed.
    group.open = holds(entry);
    group.appendChild(sub);
    li.appendChild(group);
    return li;
  }

  TREE.forEach(function (entry) { topList.appendChild(node(entry)); });

  var empty = document.createElement('p');
  empty.className = 'empty';
  empty.textContent = 'No matching pages.';
  empty.hidden = true;
  host.appendChild(empty);

  filter.addEventListener('input', function () {
    var q = filter.value.trim().toLowerCase();
    function apply(li) {
      var group = li.querySelector(':scope > details');
      if (!group) {
        var link = li.querySelector(':scope > a');
        var href = link && new URL(link.href).pathname;
        var page = searchIndex.find(function (entry) { return entry.href === href; });
        var haystack = page ? page.title + ' ' + page.text : li.textContent;
        var show = !q || haystack.toLowerCase().indexOf(q) !== -1;
        li.classList.toggle('hidden', !show);
        return show ? 1 : 0;
      }
      var kept = 0;
      Array.prototype.forEach.call(group.querySelector(':scope > ul').children, function (child) {
        kept += apply(child);
      });
      li.classList.toggle('hidden', kept === 0);
      // While filtering, expand whatever still has hits; restore on clear.
      if (q) group.open = kept > 0;
      else group.open = !!group.querySelector('a.active');
      return kept;
    }
    var hits = 0;
    Array.prototype.forEach.call(topList.children, function (li) { hits += apply(li); });
    empty.hidden = hits > 0;
  });
})();
