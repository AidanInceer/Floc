"use client";

import { useState } from "react";
import { START_PLACE_LENGTH, START_PLACES_CAP } from "@floc/core/trip/start/start-steps";

import { CrossIcon, PlusIcon } from "@/components/system/icons";
import { Button, Field, Input, cx, iconButtonClass } from "@/components/system/ui";

export function StartPlaces({ places, onChange }: { places: string[]; onChange: (places: string[]) => void }) {
  const [text, setText] = useState("");
  const full = places.length >= START_PLACES_CAP;
  const add = () => {
    const place = text.trim();
    if (!place || full || places.some((p) => p.toLowerCase() === place.toLowerCase())) return setText("");
    onChange([...places, place]);
    setText("");
  };
  return (
    <div className="grid gap-3">
      {places.length ? (
        <ol className="grid gap-1.5">
          {places.map((place, i) => (
            <li key={place} className="flex items-center gap-2.5 rounded-sm border border-pen/40 bg-pen-soft py-1 pl-2.5 pr-1 text-sm text-pen-deep">
              <span className="nums grid size-5 place-items-center rounded-full bg-sheet text-xs">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{place}</span>
              <button type="button" className={cx(iconButtonClass(false), "text-pen-deep")} aria-label={`Remove ${place}`} onClick={() => onChange(places.filter((p) => p !== place))}>
                <CrossIcon />
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      {full ? null : (
        <Field label={places.length ? "Add another place" : "Place"}>
          <span className="flex gap-2">
            <Input
              value={text}
              maxLength={START_PLACE_LENGTH}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                add();
              }}
            />
            <Button type="button" onClick={add} disabled={!text.trim()}>
              <PlusIcon />
              Add
            </Button>
          </span>
        </Field>
      )}
    </div>
  );
}
