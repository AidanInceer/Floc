export type BagLine = { packed: boolean; suggested: boolean };

export type BagAction = "suggestions" | "unpack" | "removeSuggested" | "removeUnpacked" | "empty";

export type BagConfirm = { message: string; detail: string; confirmLabel: string };

export type BagMenuItem = {
  action: BagAction;
  label: string;
  count: number | null;
  danger: boolean;
  confirm: BagConfirm | null;
};

const UNPACK: BagConfirm = {
  message: "Unpack everything?",
  detail: "It all stays in your bag, unticked.",
  confirmLabel: "Unpack it",
};

function removalWords(shown: boolean) {
  const turnsOff = shown ? " Suggestions turn off." : "";
  return {
    suggested: {
      message: "Remove suggested things?",
      detail: `Any you renamed or changed go too.${turnsOff}`,
      confirmLabel: "Remove them",
    },
    unpacked: {
      message: "Remove everything not packed?",
      detail: `This includes things you added.${turnsOff}`,
      confirmLabel: "Remove them",
    },
    empty: {
      message: "Empty your bag?",
      detail: `Everything goes, packed or not${shown ? ", and suggestions turn off" : ""}. The shared list stays.`,
      confirmLabel: "Empty it",
    },
  };
}

const offered = (when: boolean, item: BagMenuItem): BagMenuItem | null => (when ? item : null);

export function bagMenu(
  lines: BagLine[],
  suggestions: { available: boolean; shown: boolean },
): BagMenuItem[] {
  const packed = lines.filter((line) => line.packed).length;
  const unpacked = lines.length - packed;
  const suggested = lines.filter((line) => line.suggested && !line.packed).length;
  const switchLabel = suggestions.shown ? "Hide suggestions" : "Show suggestions";
  const words = removalWords(suggestions.shown);

  return [
    offered(suggestions.available, { action: "suggestions", label: switchLabel, count: null, danger: false, confirm: null }),
    offered(packed > 0, { action: "unpack", label: "Unpack everything", count: packed, danger: false, confirm: UNPACK }),
    offered(suggested > 0, { action: "removeSuggested", label: "Remove suggested", count: suggested, danger: true, confirm: words.suggested }),
    offered(packed > 0 && unpacked > 0, { action: "removeUnpacked", label: "Remove unpacked", count: unpacked, danger: true, confirm: words.unpacked }),
    offered(lines.length > 0, { action: "empty", label: "Empty your bag", count: lines.length, danger: true, confirm: words.empty }),
  ].filter((item) => item !== null);
}
