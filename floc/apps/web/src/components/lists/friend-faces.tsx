import { savedTooLabel } from "@floc/core/people/shared-saves";

import { AvatarRow } from "@/components/system/ui";

export function FriendFaces({ faces }: { faces: { name: string }[] | undefined }) {
  if (!faces?.length) return null;
  const label = savedTooLabel(faces.map((f) => f.name));
  return (
    <span title={label} className="relative z-10 inline-flex">
      <span className="sr-only">{label}</span>
      <span aria-hidden>
        <AvatarRow people={faces} max={3} size={24} spaced />
      </span>
    </span>
  );
}

export function YouBoth() {
  return <span className="typed">You both</span>;
}
