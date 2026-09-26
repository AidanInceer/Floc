// The light/dark switch every wireframe gets. Opens in light.
(function () {
  var root = document.documentElement;
  var set = function (theme) {
    root.dataset.theme = theme;
    document.querySelectorAll(".wf-theme button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.theme === theme));
    });
  };
  root.dataset.theme = "light";
  document.addEventListener("DOMContentLoaded", function () {
    var bar = document.createElement("div");
    bar.className = "wf-theme";
    bar.setAttribute("aria-label", "Theme");
    ["light", "dark"].forEach(function (theme) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.theme = theme;
      b.textContent = theme === "light" ? "Light" : "Dark";
      b.addEventListener("click", function () { set(theme); });
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
    set(root.dataset.theme);

    if (location.pathname !== "/") {
      var home = document.createElement("a");
      home.className = "wf-home";
      home.href = "/";
      home.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M8.4 3.6 5 7l3.4 3.4"/></svg>All wireframes';
      document.body.appendChild(home);
    }
  });
})();
