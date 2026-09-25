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
  });
})();
