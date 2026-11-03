// Design switcher, remembered in the hash so a reload keeps your place.
window.Kit = (function () {
  var G = {
    star: '<path d="M7 1.9 8.6 5.2 12.2 5.7 9.6 8.2 10.2 11.8 7 10.1 3.8 11.8 4.4 8.2 1.8 5.7 5.4 5.2Z"/>',
    more: '<circle cx="3" cy="7" r=".6" class="dot"/><circle cx="7" cy="7" r=".6"/><circle cx="11" cy="7" r=".6"/>',
    chev: '<path d="M4.2 5.6 7 8.4l2.8-2.8"/>',
    chevR: '<path d="M5.6 4.2 8.4 7l-2.8 2.8"/>',
    check: '<path d="M3.2 7.3 5.8 9.8l5-5.6"/>',
    plus: '<path d="M7 2.8v8.4M2.8 7h8.4"/>',
    minus: '<path d="M2.8 7h8.4"/>',
    cross: '<path d="M3.6 3.6l6.8 6.8M10.4 3.6l-6.8 6.8"/>',
    pin: '<path d="M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 0 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z"/><circle cx="7" cy="5.8" r="1.3"/>',
    sort: '<path d="M2.5 4h9M4 7h6M5.5 10h3"/>',
    bag: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4"/>',
    spark: '<path d="M7 1.8v3M7 9.2v3M1.8 7h3M9.2 7h3M3.4 3.4l1.8 1.8M8.8 8.8l1.8 1.8M10.6 3.4 8.8 5.2M5.2 8.8l-1.8 1.8"/>',
    pencil: '<path d="M9.6 2.6 11.4 4.4 4.8 11H3V9.2Z"/>',
    group: '<circle cx="5" cy="5" r="1.9"/><path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8"/><circle cx="10" cy="5.6" r="1.5"/><path d="M9.4 8.7c1.5 0 2.6.9 3 2.5"/>',
  };
  function g(name, cls) {
    var body = name === "more"
      ? '<circle cx="3" cy="7" r=".9"/><circle cx="7" cy="7" r=".9"/><circle cx="11" cy="7" r=".9"/>'
      : G[name];
    return '<svg class="g ' + (cls || "") + (name === "more" ? " fill" : "") + '" viewBox="0 0 14 14" aria-hidden="true">' + body + "</svg>";
  }
  function avatar(p, size) {
    size = size || 24;
    return '<span class="avatar who-' + p.tone + '" title="' + p.name + '" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.42) + 'px">' + (p.initial || p.name[0]) + "</span>";
  }
  function avatars(people, size, max) {
    max = max || 4;
    var shown = people.slice(0, max).map(function (p) { return avatar(p, size); }).join("");
    var rest = people.length - max;
    if (rest > 0) shown += '<span class="avatar who-8" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.4) + 'px">+' + rest + "</span>";
    return '<span class="avatar-row">' + shown + "</span>";
  }
  function switcher() {
    var set = function (d) {
      document.body.dataset.design = d;
      document.querySelectorAll(".pick button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.design === d)); });
      document.querySelectorAll("[data-idea]").forEach(function (el) { el.hidden = el.dataset.idea !== d; });
      history.replaceState(null, "", "#" + d);
    };
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".pick button"));
    var list = buttons.map(function (b) {
      var parts = b.textContent.split(" · ");
      return { key: b.dataset.design, code: parts.length > 1 ? parts[0] : b.dataset.design.toUpperCase(), name: parts.slice(1).join(" · ") || b.textContent, round: b.dataset.round ? Number(b.dataset.round) : undefined };
    });
    var hadHash = !!location.hash;
    var start = (location.hash || "#a").slice(1);
    if (!list.some(function (v) { return v.key === start; })) start = "a";
    set(start);
    import("/_house/variants.mjs").then(function (m) { m.mountVariants(list, { current: hadHash ? start : null, onPick: set }); });
  }
  function appbar(active) {
    return '<header class="appbar"><span class="wordmark">floc<i>.</i></span><nav class="navpill">' +
      ["Explore", "Trips", "Friends"].map(function (n) { return "<span" + (n === active ? ' aria-current="page"' : "") + ">" + n + "</span>"; }).join("") +
      '</nav><span class="me">' + avatar({ name: "Dev", tone: 7 }, 24) + "Dev</span></header>";
  }
  return { g: g, avatar: avatar, avatars: avatars, switcher: switcher, appbar: appbar };
})();
