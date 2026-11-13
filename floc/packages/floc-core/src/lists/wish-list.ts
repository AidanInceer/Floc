/**
 * Wish lists (#623, ADR-049): what a few people keep together before any trip exists.
 * The rules every door shares — what an item may be, how a link is read, and what an unnamed list is called.
 */
import { readCountryCode } from "../people/countries";
import { asText } from "../text/text";

export const WISH_ITEM_KINDS = ["explore", "country", "text", "link"] as const;
export type WishItemKind = (typeof WISH_ITEM_KINDS)[number];

/** `invited` cannot read the list or show on it; only `accepted` is a member (ADR-049). */
export const WISH_MEMBER_STATUSES = ["invited", "accepted"] as const;
export type WishMemberStatus = (typeof WISH_MEMBER_STATUSES)[number];

export const WISH_CAPS = { name: 60, text: 280, url: 2000, label: 120, presetId: 80 } as const;

/** One item as a door hands it in, already checked. */
export type WishItemInput =
  | { kind: "explore"; presetId: string }
  | { kind: "country"; code: string }
  | { kind: "text"; text: string }
  | { kind: "link"; url: string; label?: string | null | undefined };

const WEB = new Set(["http:", "https:"]);

function hostOf(url: URL): string {
  return url.hostname.replace(/^www\./, "");
}

/**
 * A pasted address, or null. Only http and https, so a `javascript:` link can never run from a tile.
 * Why no fetch: Floc never opens it, so the server cannot be turned on another address and the site never learns who looked (ADR-049).
 */
export function readWishLink(raw: unknown): { url: string; host: string } | null {
  const typed = asText(raw).trim();
  if (!typed || typed.length > WISH_CAPS.url || /\s/.test(typed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : `https://${typed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (!WEB.has(url.protocol) || !url.hostname.includes(".") || url.username || url.password) return null;
  const href = url.toString();
  return href.length > WISH_CAPS.url ? null : { url: href, host: hostOf(url) };
}

/** What a link tile says: its label, else the site it goes to. */
export function linkShown(label: string | null | undefined, url: string): string {
  if (label) return label;
  try {
    return hostOf(new URL(url));
  } catch {
    return url;
  }
}

function capped(raw: unknown, cap: number): string | null {
  const value = asText(raw).trim();
  return value ? value.slice(0, cap) : null;
}

export function readWishListName(raw: unknown): string | null {
  return capped(raw, WISH_CAPS.name);
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** An unnamed list is named after the other people on it, so it says who it is with. */
export function wishListTitle(name: string | null, others: string[]): string {
  if (name) return name;
  if (others.length === 0) return "Wish list";
  const shown = others.slice(0, 2).map(firstName).join(", ");
  return others.length > 2 ? `Wish list with ${shown} +${others.length - 2}` : `Wish list with ${shown}`;
}

function field(raw: object, key: string): unknown {
  return (raw as Record<string, unknown>)[key];
}

/** An item from any door, checked, or null. The server still checks an Explore id is a real listing. */
export function readWishItem(raw: unknown): WishItemInput | null {
  if (!raw || typeof raw !== "object") return null;
  switch (field(raw, "kind")) {
    case "explore": {
      const presetId = capped(field(raw, "presetId"), WISH_CAPS.presetId);
      return presetId ? { kind: "explore", presetId } : null;
    }
    case "country": {
      const code = readCountryCode(asText(field(raw, "code")).toUpperCase());
      return code ? { kind: "country", code } : null;
    }
    case "text": {
      const text = capped(field(raw, "text"), WISH_CAPS.text);
      return text ? { kind: "text", text } : null;
    }
    case "link": {
      const link = readWishLink(field(raw, "url"));
      return link ? { kind: "link", url: link.url, label: capped(field(raw, "label"), WISH_CAPS.label) } : null;
    }
    default:
      return null;
  }
}
