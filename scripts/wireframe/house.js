// The light/dark switch every wireframe gets, and Desktop/Phone beside it. Opens in light, at full width.
(function () {
  var root = document.documentElement;
  var VIEWER = "/_house/phone.html";
  var framed = false;
  try { framed = window !== window.top && window.parent.location.pathname === VIEWER; } catch (e) {}

  var set = function (theme) {
    root.dataset.theme = theme;
    document.querySelectorAll(".wf-theme [data-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.theme === theme));
    });
    // Why: in the phone viewer the page sits in a frame, and one switch should turn both.
    document.querySelectorAll("iframe").forEach(function (f) {
      try { f.contentWindow.WFTheme && f.contentWindow.WFTheme(theme); } catch (e) {}
    });
  };
  window.WFTheme = set;
  root.dataset.theme = framed ? window.parent.document.documentElement.dataset.theme || "light" : "light";

  var button = function (label, data, on) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    Object.keys(data).forEach(function (k) { b.dataset[k] = data[k]; });
    b.addEventListener("click", on);
    return b;
  };

  var navCss = function () {
    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/_house/nav.css";
    document.head.appendChild(css);
  };

  document.addEventListener("DOMContentLoaded", function () {
    // Inside the phone viewer the frame's own page shows no switches or home link: the viewer has them. Its variant panel still needs nav.css.
    if (framed) return navCss();
    var bar = document.createElement("div");
    bar.className = "wf-theme";
    bar.setAttribute("aria-label", "Theme and width");
    var phone = location.pathname === VIEWER;
    bar.appendChild(button("Desktop", { size: "desktop" }, function () {
      if (phone) location.href = decodeURIComponent(location.hash.slice(1)) || "/";
    }));
    bar.appendChild(button("Phone", { size: "phone" }, function () {
      if (!phone) location.href = VIEWER + "#" + location.pathname + location.search;
    }));
    bar.querySelectorAll("[data-size]").forEach(function (b) {
      b.setAttribute("aria-pressed", String((b.dataset.size === "phone") === phone));
    });
    var gap = document.createElement("i");
    gap.className = "wf-theme-gap";
    bar.appendChild(gap);
    ["light", "dark"].forEach(function (theme) {
      bar.appendChild(button(theme === "light" ? "Light" : "Dark", { theme: theme }, function () { set(theme); }));
    });
    document.body.appendChild(bar);
    set(root.dataset.theme);

    // Every prototype gets a link back to the index.
    if (location.pathname !== "/") {
      navCss();
      var js = document.createElement("script");
      js.src = "/_house/nav.js";
      js.onload = function () { WF.home(); };
      document.head.appendChild(js);
    }
  });
})();
