const STILL_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_STORAGE_KEY = "floc-motion";

const STILL = "still";

type Root = { dataset: DOMStringMap };

export function heldStill(root: Root, deviceStill: boolean): boolean {
  return root.dataset.motion === STILL || deviceStill;
}

export function isStill(): boolean {
  return heldStill(document.documentElement, matchMedia(STILL_QUERY).matches);
}

export function choseStill(): boolean {
  return document.documentElement.dataset.motion === STILL;
}

export function setStill(root: Root, still: boolean) {
  if (still) root.dataset.motion = STILL;
  else delete root.dataset.motion;
}

export function storeStill(still: boolean) {
  try {
    if (still) localStorage.setItem(MOTION_STORAGE_KEY, STILL);
    else localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    return;
  }
}

export function watchStill(changed: (still: boolean) => void): () => void {
  const device = matchMedia(STILL_QUERY);
  const update = () => changed(isStill());
  const marks = new MutationObserver(update);
  marks.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  device.addEventListener("change", update);
  return () => {
    marks.disconnect();
    device.removeEventListener("change", update);
  };
}

export function motionBootstrap(signedIn: boolean): string {
  if (signedIn) return "";
  return `;try{if(localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})===${JSON.stringify(STILL)})document.documentElement.dataset.motion=${JSON.stringify(STILL)}}catch(e){}`;
}
