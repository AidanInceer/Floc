// The wireframe sidebar: the index draws it in place, every prototype opens it as a drawer.
window.WF = (function () {
  // Why: the sidebar follows the app's own map, not the alphabet, so you can tell where a screen lives.
  var SECTIONS = [
    ["Signed out", ["Landing", "Sign in"]],
    ["Every page", ["Top bar", "Account menu"]],
    ["Browsing", ["Explore", "My trips", "Friends"]],
    ["In a trip", ["Trip", "Trip overview", "Dates", "Days", "Money", "Packing", "Trip notes", "Files"]],
    ["Design playground", ["Concept art", "Logos", "Type & fonts"]],
  ];
  var PLAYGROUND = "Design playground";
  var TONES = { shipped: "Shipped", chosen: "Chosen", exploring: "Exploring", parked: "Parked" };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

  function shortName(title) {
    title = title.replace(/ · Floc wireframes$/, "");
    var parts = title.split(" · ");
    return cap((parts.length > 1 ? parts.slice(1).join(" · ") : title).replace(/^#\d+\s*/, ""));
  }
  // "Chosen: E" → Chosen E; "Shipped 0.149.0" → Shipped, with the version as the note.
  function status(raw) {
    var m = (raw || "").match(/^(\w+)[:\s]*(.*)$/);
    if (!m) return { tone: "none", tag: "No status", note: "" };
    var word = m[1].toLowerCase(), rest = m[2].trim();
    var pick = (rest.match(/^([A-Z0-9+ ]{1,7})(?:,|$)/) || [])[1];
    if (word === "shipped") return { tone: "shipped", tag: "Shipped", note: rest };
    if (word === "chosen") return { tone: "chosen", tag: "Chosen" + (pick ? " " + pick.trim() : ""), note: pick ? rest.slice(pick.length).replace(/^,\s*/, "") : rest };
    if (word === "parked" || word === "explored") return { tone: "parked", tag: cap(word) + (pick ? " " + pick.trim() : ""), note: pick ? rest.slice(pick.length).replace(/^,\s*/, "") : rest };
    return { tone: "exploring", tag: "Exploring", note: rest };
  }

  function shape(list) {
    return list.map(function (p) {
      var s = status(p.status);
      return {
        folder: p.folder, title: p.title, name: shortName(p.title), page: p.page || "Not labelled", route: p.route,
        area: p.area === "design" ? "design" : "wireframes", picked: p.picked ? new Date(p.picked) : null,
        about: p.about, raw: p.status, tone: s.tone, tag: s.tag, note: s.note, changed: new Date(p.changed),
      };
    });
  }

  // Sections → pages → prototypes, newest first inside a page.
  function group(items) {
    var known = {};
    SECTIONS.forEach(function (s) { s[1].forEach(function (p) { known[p] = s[0]; }); });
    var out = SECTIONS.map(function (s) { return { name: s[0], pages: s[1].map(function (p) { return { name: p, items: [] }; }) }; });
    out.push({ name: "Other", pages: [] });
    items.forEach(function (it) {
      var section = it.area === "design" ? PLAYGROUND : (known[it.page] || "Other");
      var sec = out.find(function (s) { return s.name === section; });
      var page = sec.pages.find(function (p) { return p.name === it.page; });
      if (!page) { page = { name: it.page, items: [] }; sec.pages.push(page); }
      page.items.push(it);
      page.route = page.route || it.route;
    });
    out.forEach(function (s) {
      s.pages = s.pages.filter(function (p) { return p.items.length; });
      s.pages.forEach(function (p) { p.items.sort(function (a, b) { return b.changed - a.changed; }); });
    });
    return out.filter(function (s) { return s.pages.length; });
  }

  // "exploring" is the default view. "open" adds what is chosen and not yet built. The open prototype always shows.
  function matches(it, q, tone, current) {
    var keep = it.folder === current;
    if (tone === "open" && it.tone !== "exploring" && it.tone !== "chosen" && !keep) return false;
    if (tone && tone !== "all" && tone !== "open" && it.tone !== tone && !keep) return false;
    if (!q) return true;
    return [it.name, it.title, it.page, it.route, it.about, it.folder, it.raw].join(" ").toLowerCase().indexOf(q) !== -1;
  }

  function slug(s) { return "p-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

  function sideHtml(items, current) {
    return '<div class="wf-brand"><a href="/" class="wf-mark">floc<i>.</i></a><span class="typed">Wireframes</span></div>' +
      '<label class="wf-search"><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="6.2" cy="6.2" r="3.8"/><path d="m9 9 3 3"/></svg>' +
      '<input type="search" placeholder="Filter" aria-label="Filter wireframes" data-wf-filter></label>' +
      '<nav class="wf-tree" data-wf-tree>' + treeHtml(group(items), current) + "</nav>";
  }
  function treeHtml(sections, current) {
    if (!sections.length) return '<p class="wf-none">Nothing matches.</p>';
    var app = sections.filter(function (s) { return s.name !== PLAYGROUND; });
    var play = sections.filter(function (s) { return s.name === PLAYGROUND; });
    return (app.length ? '<div class="wf-tree-app"><p class="wf-zone typed">App pages</p>' + app.map(function (s) { return sectionHtml(s, current); }).join("") + "</div>" : "") +
      (play.length ? '<div class="wf-tree-play"><p class="wf-zone typed">Design playground</p>' + play[0].pages.map(function (p) { return pageHtml(p, current); }).join("") + "</div>" : "");
  }
  function sectionHtml(s, current) {
    return '<div class="wf-group"><p class="wf-sec">' + esc(s.name) + "</p>" + s.pages.map(function (p) { return pageHtml(p, current); }).join("") + "</div>";
  }
  function pageHtml(p, current) {
        return '<details open><summary><span>' + esc(p.name) + '</span><span class="wf-n nums">' + p.items.length + "</span></summary><ul>" +
          p.items.map(function (it) {
            var cur = it.folder === current ? ' aria-current="page"' : "";
            return '<li><a href="/' + esc(it.folder) + '/"' + cur + ' title="' + esc(it.title + " — " + (it.raw || "no status")) + '">' +
              '<span class="wf-dot wf-' + it.tone + '" aria-hidden="true"></span><span class="wf-nm">' + esc(it.name) + "</span>" +
              '<span class="wf-sr">' + esc(it.tag) + "</span></a></li>";
          }).join("") + "</ul></details>";
  }

  // Draws the sidebar into el and keeps the tree in step with the filter box.
  function sidebar(el, items, opts) {
    opts = opts || {};
    el.innerHTML = sideHtml(items, opts.current);
    var input = el.querySelector("[data-wf-filter]");
    var tree = el.querySelector("[data-wf-tree]");
    function redraw() {
      var q = input.value.trim().toLowerCase();
      tree.innerHTML = treeHtml(group(items.filter(function (it) { return matches(it, q, opts.tone && opts.tone(), opts.current); })), opts.current);
      if (opts.onRedraw) opts.onRedraw();
      if (opts.onFilter) opts.onFilter(q);
    }
    input.addEventListener("input", redraw);
    redraw();
    var cur = tree.querySelector('[aria-current="page"]');
    if (cur) cur.scrollIntoView({ block: "center" });
    return { redraw: redraw, input: input };
  }

  function load() {
    return fetch("/_house/list.json").then(function (r) { return r.json(); }).then(shape);
  }

  // Inside a prototype: bottom-left controls open the browser or return to its index.
  function drawer(current) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wf-open";
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 3.5h10M2 7h10M2 10.5h10"/></svg>Wireframes';
    var controls = document.createElement("div");
    controls.className = "wf-controls";
    controls.appendChild(btn);
    var home = document.createElement("a");
    home.className = "wf-home-link";
    home.href = "/";
    home.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M11.5 7H2.5m0 0 3.2-3.2M2.5 7l3.2 3.2"/></svg>Home';
    controls.appendChild(home);
    var shade = document.createElement("div");
    shade.className = "wf-shade";
    var panel = document.createElement("aside");
    panel.className = "wf-side wf-drawer";
    panel.setAttribute("aria-label", "Wireframes");
    document.body.append(controls, shade, panel);
    var ready = null;
    var tone = "exploring";
    function open() {
      ready = ready || load().then(function (items) {
        var foot = document.createElement("button");
        foot.type = "button";
        foot.className = "wf-more";
        var hidden = items.filter(function (it) { return !matches(it, "", "exploring", current); }).length;
        var s = sidebar(panel, items, {
          current: current,
          tone: function () { return tone; },
          onRedraw: function () { foot.textContent = tone === "exploring" ? "Show chosen, shipped and parked (" + hidden + ")" : "Only exploring"; },
        });
        foot.addEventListener("click", function () { tone = tone === "exploring" ? "all" : "exploring"; s.redraw(); });
        panel.appendChild(foot);
        s.redraw();
        return s;
      });
      document.body.classList.add("wf-drawer-open");
      btn.setAttribute("aria-expanded", "true");
      ready.then(function (s) { s.input.focus(); });
    }
    function close() {
      document.body.classList.remove("wf-drawer-open");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () { document.body.classList.contains("wf-drawer-open") ? close() : open(); });
    shade.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
      // Why: "\" is free on every prototype — none of them type into a field that needs it.
      if (e.key === "\\" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
        e.preventDefault();
        document.body.classList.contains("wf-drawer-open") ? close() : open();
      }
    });
    return { open: open, close: close };
  }

  return { load: load, sidebar: sidebar, drawer: drawer, group: group, matches: matches, slug: slug, esc: esc, TONES: TONES };
})();
