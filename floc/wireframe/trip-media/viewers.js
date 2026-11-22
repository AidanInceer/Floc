export function shell(cls, html, onClose) {
  const d = document.createElement("dialog");
  d.className = `mv ${cls}`;
  d.innerHTML = html;
  document.body.appendChild(d);
  d.addEventListener("click", (e) => { if (e.target === d) onClose(); });
  d.addEventListener("cancel", (e) => { e.preventDefault(); onClose(); });
  return d;
}

export const arrows = (d, go) =>
  d.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  });
