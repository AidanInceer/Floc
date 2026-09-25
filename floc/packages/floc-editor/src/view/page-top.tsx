/**
 * The top of a notes page (#408): its icon (or a quiet "Add icon"), its name,
 * and the icon picker the page list uses too. The name saves as it is typed.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { PAGE_ICONS, PAGE_ICON_LABELS, type PageIcon } from "@floc/core/notes/pages/page-icons";
import { PAGE_LIMITS } from "@floc/core/notes/pages/page-rules";

import { Glyph } from "./icons";
import { Menu, type Point } from "./floating";

export function IconPicker({ at, current, onPick, onClose }: { at: Point; current: PageIcon | null; onPick: (icon: PageIcon | null) => void; onClose: () => void }) {
  return (
    <Menu at={at} label="Page icon" onClose={onClose} className="fe-icon-picker">
      <div className="fe-icon-grid">
        {PAGE_ICONS.map((icon) => (
          <button key={icon} type="button" className={`fe-icon-choice${current === icon ? " is-on" : ""}`} title={PAGE_ICON_LABELS[icon]} aria-label={PAGE_ICON_LABELS[icon]} aria-pressed={current === icon}
            onClick={() => { onPick(icon); onClose(); }}>
            <Glyph name={icon} size={16} />
          </button>
        ))}
      </div>
      {current ? (
        <>
          <div className="fe-menu-sep" />
          <button type="button" onClick={() => { onPick(null); onClose(); }}>Remove icon</button>
        </>
      ) : null}
    </Menu>
  );
}

const SAVE_AFTER_MS = 500;

export function PageTop({ title, icon, onRename, onIcon, onDown, touch = false }: {
  title: string;
  icon: PageIcon | null;
  onRename: (title: string) => void;
  onIcon: (icon: PageIcon | null) => void;
  /** Enter or the down arrow in the name moves into the page. */
  onDown: () => void;
  touch?: boolean;
}) {
  const [value, setValue] = useState(title);
  const [picker, setPicker] = useState<Point | null>(null);
  const typing = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!typing.current) setValue(title);
  }, [title]);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (!typing.current) return;
    const timer = setTimeout(() => {
      typing.current = false;
      if (value.trim() !== title) onRename(value);
    }, SAVE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [value, title, onRename]);

  const openPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPicker({ left: rect.left, top: rect.bottom + 4 });
  };

  return (
    <div className={`fe-top${touch ? " is-touch" : ""}`}>
      {icon ? (
        <button type="button" className="fe-page-icon" title="Change icon" aria-label="Change icon" onClick={openPicker}><Glyph name={icon} size={34} /></button>
      ) : (
        <button type="button" className="fe-quiet fe-add-icon" onClick={openPicker}><Glyph name="star" size={13} />Add icon</button>
      )}
      <textarea
        ref={field}
        className="fe-title"
        autoFocus={!title}
        rows={1}
        value={value}
        maxLength={PAGE_LIMITS.titleChars}
        placeholder="Untitled"
        aria-label="Page name"
        onChange={(event) => { typing.current = true; setValue(event.target.value.replace(/\n/g, "")); }}
        onBlur={() => { if (typing.current) { typing.current = false; if (value.trim() !== title) onRename(value); } }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || (event.key === "ArrowDown" && event.currentTarget.selectionStart === value.length)) {
            event.preventDefault();
            onDown();
          }
        }}
      />
      {picker ? <IconPicker at={picker} current={icon} onPick={onIcon} onClose={() => setPicker(null)} /> : null}
    </div>
  );
}
