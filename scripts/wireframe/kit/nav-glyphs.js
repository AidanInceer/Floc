// Line glyphs for the header and trip-tab wireframes. 14×14, stroke only.
window.NavGlyphs = {
  explore: '<circle cx="7" cy="7" r="5"/><path d="M9.2 4.8 8 8 4.8 9.2 6 6z"/>',
  trips: '<path d="M1.6 4.4h10.8v7.2H1.6zM5 4.4V3a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.4M1.6 8h10.8"/>',
  friends: '<circle cx="5" cy="5" r="1.9"/><path d="M1.6 11.4c.4-1.8 1.7-2.8 3.4-2.8s3 1 3.4 2.8"/><circle cx="10" cy="5.6" r="1.5"/><path d="M9.4 8.7c1.5 0 2.6.9 3 2.5"/>',
  overview: '<path d="M2 3h10v8H2zM2 9l3-2.6 2.4 2 2-1.5L12 9.4"/>',
  dates: '<path d="M2.2 3.4h9.6v8.4H2.2zM2.2 6h9.6M4.8 2v2.4M9.2 2v2.4"/>',
  days: '<circle cx="3.4" cy="3.6" r="1.2"/><circle cx="10.6" cy="10.4" r="1.2"/><path d="M4.6 3.6h4.6a1.7 1.7 0 0 1 0 3.4H4.8a1.7 1.7 0 0 0 0 3.4h4.6"/>',
  money: '<circle cx="7" cy="7" r="5"/><path d="M8.6 4.6a1.8 1.8 0 0 0-3.1 1.2v3.6H4.6M4.6 7.4h3M5.5 9.4h4"/>',
  packing: '<path d="M3.2 4.6h7.6l-.6 7.4H3.8zM5.2 4.6V3.4a1.8 1.8 0 0 1 3.6 0v1.2"/>',
  notes: '<path d="M3 1.8h5.4L11 4.4v7.8H3zM8.2 1.8v2.8H11M5 7h4M5 9.4h3"/>',
  files: '<path d="M1.8 3.2h3.6l1.2 1.4h5.6v7H1.8z"/>',
  more: '<circle cx="3" cy="7" r=".9"/><circle cx="7" cy="7" r=".9"/><circle cx="11" cy="7" r=".9"/>',
  chev: '<path d="M4.2 5.6 7 8.4l2.8-2.8"/>',
  bell: '<path d="M3.5 9.8V6.3a3.5 3.5 0 0 1 7 0v3.5l1 1.2h-9l1-1.2Z"/><path d="M5.8 12.3a1.3 1.3 0 0 0 2.4 0"/>',
  pin: '<path d="M7 12.4s3.8-3.6 3.8-6.6a3.8 3.8 0 0 0-7.6 0c0 3 3.8 6.6 3.8 6.6Z"/><circle cx="7" cy="5.8" r="1.3"/>',
  plus: '<path d="M7 2.8v8.4M2.8 7h8.4"/>',
};
window.glyph = function (name, cls) {
  var fill = name === "more" ? " fill" : "";
  return '<svg class="g ' + (cls || "") + fill + '" viewBox="0 0 14 14" aria-hidden="true">' + NavGlyphs[name] + "</svg>";
};
// Slides an .ind element under the current item of every [data-slide] nav.
window.slideAll = function () {
  document.querySelectorAll("[data-slide]").forEach(function (nav) {
    var ind = nav.querySelector(".ind");
    var cur = nav.querySelector('[aria-current="page"]');
    if (!ind) return;
    if (!cur || !nav.offsetParent) { ind.style.opacity = 0; return; }
    var n = nav.getBoundingClientRect(), c = cur.getBoundingClientRect();
    var mode = nav.dataset.slide;
    ind.style.opacity = 1;
    if (mode === "y") {
      ind.style.transform = "translateY(" + (c.top - n.top + nav.scrollTop) + "px)";
      ind.style.height = c.height + "px";
    } else {
      ind.style.transform = "translateX(" + (c.left - n.left + nav.scrollLeft) + "px)";
      ind.style.width = c.width + "px";
    }
  });
};
window.addEventListener("resize", function () { window.slideAll(); });
