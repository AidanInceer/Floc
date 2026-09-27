// The wireframes index: sidebar on the left, every prototype as a card, grouped by where it lives in the app.
(function () {
  var main = document.getElementById("wf-main");
  var side = document.getElementById("wf-side");
  var tone = "open";
  var query = "";
  var items = [];
  var esc = WF.esc;

  function day(d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }) });
  }

  function card(it) {
    var picked = it.tone === "chosen" ? (it.picked || it.changed) : null;
    return '<li><a class="wf-card2" href="/' + esc(it.folder) + '/">' +
      '<b class="wf-card2-name">' + esc(it.name) + '</b>' +
      '<span class="wf-tag wf-' + it.tone + '">' + esc(it.tag) + "</span>" +
      (picked ? '<span class="wf-picked">Picked ' + day(picked) + "</span>" : "") +
      "</a></li>";
  }

  function filters() {
    var counts = { all: items.length, open: 0 };
    items.forEach(function (it) {
      counts[it.tone] = (counts[it.tone] || 0) + 1;
      if (it.tone === "exploring" || it.tone === "chosen") counts.open++;
    });
    var LABEL = { open: "Open", all: "All" };
    var btn = function (k) {
      return '<button type="button" data-tone="' + k + '" aria-pressed="' + (k === tone) + '"' + (k === "open" ? ' title="Exploring, or chosen and not built yet"' : "") + ">" +
        (LABEL[k] ? "" : '<span class="wf-dot wf-' + k + '" aria-hidden="true"></span>') + (LABEL[k] || WF.TONES[k]) + ' <span class="nums">' + counts[k] + "</span></button>";
    };
    var lead = ["open", "all"].map(btn).join("");
    var rest = ["exploring", "chosen", "shipped", "parked"].filter(function (k) { return counts[k]; }).map(btn).join("");
    return '<div class="wf-tones" role="group" aria-label="Show">' + lead + '<span class="wf-rule" aria-hidden="true"></span>' + rest + "</div>";
  }

  function visibleItems() {
    return items.filter(function (it) { return WF.matches(it, query, tone); });
  }

  function wireframeBody(shown) {
    var sections = WF.group(shown.filter(function (it) { return it.area !== "design"; }));
    if (!sections.length) return '<p class="wf-none">No wireframes match' + (query ? " “" + esc(query) + "”" : "") + ".</p>";
    return sections.map(function (s) {
      return '<section class="wf-sec2"><p class="typed">' + esc(s.name) + "</p>" + s.pages.map(function (p) {
        return '<div class="wf-page" id="' + WF.slug(p.name) + '"><h2>' + esc(p.name) + (p.route ? " <code>" + esc(p.route) + "</code>" : "") + "</h2>" +
          '<ul class="wf-cards">' + p.items.map(card).join("") + "</ul></div>";
      }).join("") + "</section>";
    }).join("");
  }

  function playgroundBody(shown) {
    var categories = ["Concept art", "Logos", "Type & fonts"];
    var all = items.filter(function (it) { return it.area === "design"; });
    var design = shown.filter(function (it) { return it.area === "design"; });
    if (!design.length && (query || tone !== "open") && all.length) {
      return '<p class="wf-none">No design studies match' + (query ? " “" + esc(query) + "”" : "") + ".</p>";
    }
    var groups = categories.map(function (category) {
      var existing = all.filter(function (it) { return it.page === category; });
      var matches = design.filter(function (it) { return it.page === category; });
      if (!existing.length) return '<section class="wf-playground-slot"><h3>' + esc(category) + '</h3><p class="wf-empty-slot">No studies yet</p></section>';
      if (!matches.length) return "";
      return '<section class="wf-playground-slot"><h3>' + esc(category) + '</h3><ul class="wf-cards">' + matches.map(card).join("") + "</ul></section>";
    }).join("");
    var other = design.filter(function (it) { return categories.indexOf(it.page) === -1; });
    if (other.length) groups += '<section class="wf-playground-slot"><h3>Other studies</h3><ul class="wf-cards">' + other.map(card).join("") + "</ul></section>";
    return '<div class="wf-playground-grid">' + groups + "</div>";
  }

  function body() {
    var shown = visibleItems();
    return wireframeBody(shown) + '<section class="wf-playground" id="design-playground"><header class="wf-playground-head"><h2>Design playground</h2></header>' + playgroundBody(shown) + "</section>";
  }

  function draw() {
    main.querySelector("[data-wf-body]").innerHTML = body();
    main.querySelectorAll("[data-tone]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tone === tone)); });
  }

  WF.load().then(function (list) {
    items = list;
    main.innerHTML = '<header class="wf-top"><h1>Wireframes</h1>' + filters() + '</header><div data-wf-body></div>' +
      '<p class="wf-hint typed">Press \\ inside any wireframe to open this list</p>';
    var s = WF.sidebar(side, items, { tone: function () { return tone; }, onFilter: function (q) { query = q; draw(); } });
    main.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tone]");
      if (!b) return;
      tone = b.dataset.tone;
      s.redraw();
    });
    // On a phone the sidebar is a drawer too.
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "wf-open wf-open-index";
    toggle.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 3.5h10M2 7h10M2 10.5h10"/></svg>Browse';
    toggle.addEventListener("click", function () { document.body.classList.toggle("wf-drawer-open"); });
    var shade = document.createElement("div");
    shade.className = "wf-shade";
    shade.addEventListener("click", function () { document.body.classList.remove("wf-drawer-open"); });
    document.body.append(toggle, shade);
    draw();
  });
})();
