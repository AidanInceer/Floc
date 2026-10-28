import { middleOf, type Countries } from "./countries";
import { arc, middle, type LatLng } from "./sphere";

const EUROPE: LatLng = { lat: 47, lng: 4 };
// Why 40: Europe and the Mediterranean sit inside it, Europe and Japan do not.
const GROUP = 40;

/** Where a travel globe opens: the middle of the largest group of been-there countries, or Europe when there are none. */
export function openingPlace(land: Countries, beenThere: readonly string[]): LatLng {
  const places = beenThere.map((code) => middleOf(land, code)).filter((p): p is LatLng => p !== null);
  if (places.length === 0) return EUROPE;
  const groups = places.map((p) => places.filter((q) => arc(p, q) < GROUP));
  return middle(groups.reduce((big, g) => (g.length > big.length ? g : big), groups[0]));
}
