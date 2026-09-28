/* Why: no build step, so TREE is the doc index. Loaded by <script src>, not fetch (file:// blocks it).
 * Each page's <body> sets data-root (path up to docs/) and data-page (an id in TREE).
 * TREE also drives the breadcrumb, hub cards (<div class="cards" data-hub="key">) and the
 * footer: `related` ids link both ways, `adr` numbers link into the decision log. */

(function () {
  var TREE = [
    {
      label: 'Foundation', key: 'foundation',
      children: [
        { id: 'index', label: 'Overview', href: 'index.html', blurb: 'Where everything is, and how the docs fit together.' },
        { id: 'mission', label: 'Mission and values', href: 'foundation/mission.html', blurb: 'What Floc is for, who it is for, and how to choose.', related: ['decisions', 'vocab'] },
        { id: 'decisions', label: 'Decision log', href: 'foundation/decisions.html', blurb: 'Every decision that shapes the build, and why.', related: ['mission'] },
        { id: 'vocab', label: 'Vocabulary', href: 'foundation/vocab.html', blurb: 'The words Floc uses, and the words it does not.', related: ['data-model', 'product'] }
      ]
    },
    {
      label: 'Product', key: 'product',
      children: [
        { id: 'product', label: 'User journey', href: 'product/index.html', blurb: 'Every page, its one job, and how a group moves through them.', related: ['visual-language', 'engineering'] },
        {
          label: 'Getting in', key: 'getting-in', blurb: 'How a person finds a trip, or is let into one.',
          children: [
            { id: 'explore', label: 'Explore', href: 'product/explore/index.html', blurb: 'Ready-made trips for a group with nowhere in mind.', related: ['partner-trips', 'trips-home', 'notes', 'map-embed'] },
            { id: 'partner-trips', label: 'Partner trips', href: 'product/explore/partner-trips.html', blurb: 'Listings on Explore, and how one becomes a trip.', related: ['monetisation', 'listings-legal'] },
            { id: 'trips-home', label: 'Trips home', href: 'product/trips-home/index.html', blurb: 'Your trips, and which ones wait on you.', related: ['overview', 'invite'] },
            { id: 'invite', label: 'Invite', href: 'product/invite/index.html', blurb: 'See the trip before you sign up.', related: ['access', 'security', 'overview'], adr: [5, 18] }
          ]
        },
        {
          label: 'The trip', key: 'trip', blurb: 'The tabs of one trip, in planning order.',
          children: [
            { id: 'overview', label: 'Trip overview', href: 'product/overview/index.html', blurb: 'Where the trip goes, who is going, what is open.', related: ['dates', 'itinerary', 'files', 'money', 'packing'], adr: [4, 6] },
            { id: 'dates', label: 'Dates', href: 'product/itinerary/dates.html', blurb: 'Find the days everyone can make.', related: ['itinerary', 'pro'], adr: [9, 10] },
            { id: 'itinerary', label: 'Days', href: 'product/itinerary/index.html', blurb: 'The plan on a calendar, day by day.', related: ['dates', 'notes', 'files', 'map-embed'], adr: [3, 10] },
            { id: 'money', label: 'Money', href: 'product/money/index.html', blurb: 'Record spend and settle who owes who.', related: ['splitwise', 'tricount'], adr: [1, 2] },
            { id: 'packing', label: 'Packing', href: 'product/packing/index.html', blurb: 'Share group gear and pack your own bag.', related: ['pro'] },
            { id: 'notes', label: 'Notes', href: 'product/notes/index.html', blurb: 'Shared live pages for what fits nowhere else.', related: ['itinerary'], adr: [14, 17] },
            { id: 'files', label: 'Files', href: 'product/files/index.html', blurb: 'Tickets and bookings in one place.', related: ['security', 'pro'] }
          ]
        },
        {
          label: 'Across trips', key: 'across', blurb: 'Notifications, Kiwi and Pro.',
          children: [
            { id: 'notifications', label: 'Notifications', href: 'product/notifications/index.html', blurb: 'Activity log, inbox, push, email and reminders.', related: ['operations'] },
            {
              label: 'Kiwi', key: 'kiwi',
              children: [
                { id: 'kiwi', label: 'Kiwi', href: 'product/kiwi/index.html', blurb: 'The pocket travel agent. Name now, build to follow.', related: ['pro', 'mission'], adr: [13, 20] },
                { id: 'kiwi-blueprint', label: 'Blueprint', href: 'product/kiwi/blueprint.html', blurb: 'What Kiwi does and in what order it lands.' },
                { id: 'kiwi-experience', label: 'Experience', href: 'product/kiwi/experience.html', blurb: 'How a member meets and uses Kiwi.', related: ['visual-language'] },
                { id: 'kiwi-pipeline', label: 'Pipeline', href: 'product/kiwi/pipeline.html', blurb: 'From a request to an answer on the trip.', related: ['api'] },
                { id: 'kiwi-safety', label: 'Safety and privacy', href: 'product/kiwi/safety.html', blurb: 'Data, injection and output rules.', related: ['security'] },
                { id: 'kiwi-delivery', label: 'Testing and delivery', href: 'product/kiwi/delivery.html', blurb: 'How Kiwi is tested and shipped.' },
                { id: 'kiwi-agents', label: 'Outside agents and models', href: 'product/kiwi/agents.html', blurb: 'Other agents and models that reach Floc.' }
              ]
            },
            { id: 'pro', label: 'Pro', href: 'product/pro/index.html', blurb: 'What Pro is, what it gates, and how the gate works.', related: ['monetisation', 'pricing-models'], adr: [12, 13] }
          ]
        }
      ]
    },
    {
      label: 'Design', key: 'design',
      children: [
        { id: 'design', label: 'Design approach', href: 'design/index.html', blurb: 'How a page earns clarity, hierarchy and trust.', related: ['visual-language'], adr: [19] },
        { id: 'visual-language', label: 'Visual language', href: 'design/visual-language.html', blurb: 'Tokens, type, icons, contrast, components.', related: ['platforms'] }
      ]
    },
    {
      label: 'Engineering', key: 'engineering',
      children: [
        { id: 'engineering', label: 'Architecture', href: 'engineering/index.html', blurb: 'System map, layers, requests, invariants, trip state.', related: ['data-model', 'api', 'access', 'platforms', 'operations'], adr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
        { id: 'data-model', label: 'Data model', href: 'engineering/data-model.html', blurb: 'The ERD. It and db/schema.ts change together.', related: ['vocab'] },
        { id: 'api', label: 'API map', href: 'engineering/api.html', blurb: 'Every tRPC procedure, and whether the phone has it.', related: ['platforms', 'access'] },
        { id: 'access', label: 'Access and permissions', href: 'engineering/access.html', blurb: 'Who reaches a trip, the doors in, member and admin powers.', related: ['security'], adr: [5, 6] },
        { id: 'security', label: 'Security and privacy', href: 'engineering/security.html', blurb: 'Personal data, auth, signed links, threats, cookies.', related: ['operations'] },
        { id: 'platforms', label: 'Web, iOS and Android', href: 'engineering/platforms.html', blurb: 'What is shared, what each surface does, the phone gaps.' },
        { id: 'operations', label: 'Environments and runbook', href: 'engineering/operations.html', blurb: 'Where Floc runs, env vars, deploy, rollback, fixes.', related: ['ci'], adr: [11] },
        { id: 'ci', label: 'CI', href: 'engineering/ci.html', blurb: 'The workflows, each job, and what is paused.', related: ['lifecycle'] }
      ]
    },
    {
      label: 'Process', key: 'process',
      children: [
        { id: 'lifecycle', label: 'Development lifecycle', href: 'process/lifecycle.html', blurb: 'Idea to production: tickets, priority, build, push, release.', related: ['ci', 'editing-docs'], adr: [15] },
        { id: 'editing-docs', label: 'Editing these docs', href: 'process/editing-docs.html', blurb: 'How the docs are laid out, linked and checked.' }
      ]
    },
    {
      label: 'Business', key: 'business',
      children: [
        { id: 'pitch', label: 'Investor pitch', href: 'business/pitch.html', blurb: 'Ten slides: problem, product, market, model, ask.', related: ['roadmap', 'monetisation', 'competitors', 'mission'] },
        { id: 'roadmap', label: 'Roadmap to full time', href: 'business/roadmap.html', blurb: 'Stages to a company, go-live checklist, funding.', related: ['monetisation'] },
        { id: 'monetisation', label: 'Monetisation', href: 'business/monetisation.html', blurb: 'The commercial stance, the options, what is ruled out.', related: ['pricing-models', 'partner-trips'], adr: [13] }
      ]
    },
    {
      label: 'Research', key: 'research',
      children: [
        { id: 'research', label: 'Research', href: 'research/index.html', blurb: 'What we looked into before deciding.' },
        {
          label: 'Competitors', key: 'competitors', blurb: 'A summary, then one page per app.',
          children: [
            { id: 'competitors', label: 'Summary', href: 'research/competitors/index.html', blurb: 'Wanderlog, TripIt, Splitwise, Polarsteps and others.' },
            { id: 'polarsteps', label: 'Polarsteps', href: 'research/competitors/polarsteps.html' },
            { id: 'splitwise', label: 'Splitwise', href: 'research/competitors/splitwise.html' },
            { id: 'tripit', label: 'TripIt', href: 'research/competitors/tripit.html', related: ['itinerary'] },
            { id: 'wanderlog', label: 'Wanderlog', href: 'research/competitors/wanderlog.html', related: ['itinerary'] },
            { id: 'wanderlust', label: 'Wanderlust', href: 'research/competitors/wanderlust.html' },
            { id: 'tricount', label: 'Tricount', href: 'research/competitors/tricount.html' },
            { id: 'troupe', label: 'Troupe', href: 'research/competitors/troupe.html', related: ['dates'] },
            { id: 'lets-jetty', label: "Let's Jetty", href: 'research/competitors/lets-jetty.html' },
            { id: 'squadtrip', label: 'SquadTrip', href: 'research/competitors/squadtrip.html', related: ['money'] },
            { id: 'roadtrippers', label: 'Roadtrippers', href: 'research/competitors/roadtrippers.html' },
            { id: 'stippl', label: 'Stippl', href: 'research/competitors/stippl.html' },
            { id: 'lambus', label: 'Lambus', href: 'research/competitors/lambus.html' }
          ]
        },
        { id: 'pricing-models', label: 'Pricing models', href: 'research/pricing-models.html', blurb: 'Pricing for bursty, trip-shaped use.' },
        { id: 'map-embed', label: 'Map embed options', href: 'research/map-embed.html', blurb: 'Map providers, cost and limits.' },
        { id: 'listings-legal', label: 'Listings and legal', href: 'research/listings-legal.html', blurb: 'What listing a trip means in law.' }
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

  // Why: everything below is drawn from TREE and marked data-generated, so the page editor strips it on save.
  var pages = {};
  var trail = {};
  var backlinks = {};
  (function index(list, path) {
    list.forEach(function (entry) {
      if (entry.children) return index(entry.children, path.concat(entry));
      pages[entry.id] = entry;
      trail[entry.id] = path;
      (entry.related || []).forEach(function (id) { (backlinks[id] = backlinks[id] || []).push(entry.id); });
    });
  })(TREE, []);

  function findGroup(list, key) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) return list[i];
      if (list[i].children) { var hit = findGroup(list[i].children, key); if (hit) return hit; }
    }
    return null;
  }

  function leaves(entry) {
    return entry.children ? entry.children.reduce(function (all, child) { return all.concat(leaves(child)); }, []) : [entry];
  }

  var main = document.querySelector('main');
  var me = pages[current];
  if (!main || !me) return;

  var crumb = document.createElement('p');
  crumb.className = 'crumb';
  crumb.setAttribute('data-generated', '');
  crumb.textContent = ['Docs'].concat(trail[current].map(function (g) { return g.label; })).join(' / ');
  main.insertBefore(crumb, main.firstChild);

  Array.prototype.forEach.call(main.querySelectorAll('[data-hub]'), function (host) {
    var group = findGroup(TREE, host.getAttribute('data-hub'));
    if (!group) return;
    host.innerHTML = '';
    group.children.forEach(function (child) {
      var target = child.children ? leaves(child)[0] : child;
      if (target.id === current) return;
      var a = document.createElement('a');
      a.className = 'card';
      a.href = url(target.href);
      var b = document.createElement('b');
      b.textContent = child.children ? child.label : target.label;
      var span = document.createElement('span');
      span.textContent = child.blurb || target.blurb || '';
      a.appendChild(b);
      a.appendChild(span);
      host.appendChild(a);
    });
  });

  function row(title, items) {
    if (!items.length) return null;
    var div = document.createElement('div');
    var h = document.createElement('h4');
    h.textContent = title;
    var ul = document.createElement('ul');
    items.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      li.appendChild(a);
      ul.appendChild(li);
    });
    div.appendChild(h);
    div.appendChild(ul);
    return div;
  }

  function pageItems(ids) {
    var seen = {};
    return ids.filter(function (id) {
      if (seen[id] || id === current || !pages[id]) return false;
      seen[id] = true;
      return true;
    }).map(function (id) { return { href: url(pages[id].href), label: pages[id].label }; });
  }

  var footer = document.createElement('footer');
  footer.className = 'doc-links';
  footer.setAttribute('data-generated', '');
  [
    row('Related', pageItems(me.related || [])),
    row('Linked from', pageItems((backlinks[current] || []).filter(function (id) { return (me.related || []).indexOf(id) === -1; }))),
    row('Decisions', (me.adr || []).map(function (n) {
      var tag = 'ADR-' + ('00' + n).slice(-3);
      return { href: url('foundation/decisions.html#' + tag.toLowerCase()), label: tag };
    }))
  ].forEach(function (div) { if (div) footer.appendChild(div); });
  if (footer.children.length) main.appendChild(footer);
})();
