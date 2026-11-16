"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { CrossIcon } from "@/components/system/icons";
import { cx, ErrorText, iconButtonClass, Input } from "@/components/system/ui";
import { airportLabel, airportPlace, loadAirports, searchAirports, type Airport } from "@floc/core/money/estimate/guide/airports/airports";

type Chosen = { code: string; label: string } | null;

function Options({ listId, hits, active, onActive, onPick }: { listId: string; hits: Airport[]; active: number; onActive: (i: number) => void; onPick: (a: Airport) => void }) {
  return (
    <ul id={listId} role="listbox" className="mt-1 grid gap-0.5" onMouseDown={(e) => { e.preventDefault(); }}>
      {hits.map((a, i) => (
        <li
          key={a.code}
          id={`${listId}-${a.code}`}
          role="option"
          aria-selected={i === active}
          onMouseEnter={() => { onActive(i); }}
          onClick={() => { onPick(a); }}
          className={cx("grid cursor-pointer gap-0.5 rounded-sm px-2.5 py-1.5 text-sm", i === active ? "bg-pen-soft text-pen-deep" : "text-ink")}
        >
          <span className="break-words">{a.name}</span>
          <span className="break-words font-mono text-xs text-ink-soft">{airportPlace(a)}</span>
        </li>
      ))}
    </ul>
  );
}

export function AirportField({ id, chosen: saved, describedBy }: { id: string; chosen: Chosen; describedBy?: string }) {
  const [chosen, setChosen] = useState<Chosen>(saved);
  const [text, setText] = useState(saved?.label ?? "");
  const [airports, setAirports] = useState<Airport[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const hidden = useRef<HTMLInputElement>(null);
  const submit = useRef(false);
  const listId = useId();

  const hits = open && airports ? searchAirports(airports, text) : [];
  const nothing = open && airports !== null && text.trim() !== "" && hits.length === 0;

  useEffect(() => {
    if (!submit.current) return;
    submit.current = false;
    hidden.current?.form?.requestSubmit();
  }, [chosen]);

  function pick(airport: Airport | null) {
    const next = airport ? { code: airport.code, label: airportLabel(airport) } : null;
    setText(next?.label ?? "");
    setOpen(false);
    submit.current = next?.code !== chosen?.code;
    setChosen(next);
  }

  function type(event: ChangeEvent<HTMLInputElement>) {
    event.stopPropagation();
    setText(event.target.value);
    setOpen(true);
    setActive(0);
  }

  function keys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => Math.min(Math.max(i + step, 0), Math.max(hits.length - 1, 0)));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const hit = hits[active];
      if (hit) pick(hit);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="w-full sm:w-80">
      <input ref={hidden} type="hidden" name="airport" value={chosen?.code ?? ""} />
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-describedby={describedBy}
          aria-activedescendant={hits[active] ? `${listId}-${hits[active].code}` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={text}
          onChange={type}
          onKeyDown={keys}
          onFocus={(e) => {
            e.target.select();
            loadAirports().then((list) => { setAirports(list); setFailed(false); }, () => { setFailed(true); });
          }}
          onBlur={() => { setOpen(false); setText(chosen?.label ?? ""); }}
          className="pr-9"
        />
        {text ? (
          <span className="absolute inset-y-0 right-1 flex items-center">
            <button type="button" aria-label="Clear home airport" onClick={() => { pick(null); }} className={iconButtonClass(false)}>
              <CrossIcon />
            </button>
          </span>
        ) : null}
      </div>
      {hits.length > 0 ? <Options listId={listId} hits={hits} active={active} onActive={setActive} onPick={pick} /> : null}
      {nothing ? <p role="status" className="mt-1 px-2.5 py-1.5 text-sm text-ink-soft">No airport found</p> : null}
      {failed ? <div className="mt-1"><ErrorText>The airport list did not load. Click the field to try again.</ErrorText></div> : null}
    </div>
  );
}
