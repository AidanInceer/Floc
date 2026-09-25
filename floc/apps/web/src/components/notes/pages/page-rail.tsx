/**
 * The page list (#408): pages and one level of sub-pages, each with an optional
 * icon. Double-click renames; drag moves within its own list; the ⋯ menu adds
 * a sub-page, renames, sets the icon or archives. Archived pages wait below
 * with their days left, and Restore.
 */
"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Glyph, Icon } from "@floc/editor/view/icons";
import { IconPicker } from "@floc/editor/view/page-top";
import { Menu, type Point } from "@floc/editor/view/floating";
import type { PresentPerson } from "@floc/core/notes/live/live-presence";
import { archiveDaysLeft, pagesRefusal } from "@floc/core/notes/pages/page-rules";
import type { PageIcon } from "@floc/core/notes/pages/page-icons";

import { AvatarRow, cx } from "@/components/system/ui";

export type RailPage = { id: number; parentId: number | null; title: string; icon: PageIcon | null; depth: 0 | 1 };
export type RailArchived = { id: number; title: string; icon: PageIcon | null; archivedAt: string };

export type RailActions = {
  open: (id: number) => void;
  add: (parentId: number | null) => void;
  rename: (id: number, title: string) => void;
  icon: (id: number, icon: PageIcon | null) => void;
  /** Moves a page next to a sibling: before it, or after it. */
  move: (id: number, target: number, after: boolean) => void;
  archive: (id: number) => void;
  restore: (id: number) => void;
};

const nameOf = (page: { title: string }) => page.title || "Untitled";

function RenameField({ page, onDone }: { page: RailPage; onDone: (title: string | null) => void }) {
  const [value, setValue] = useState(page.title);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  return (
    <input
      ref={input}
      className="notes-rename"
      value={value}
      placeholder="Untitled"
      aria-label="Page name"
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onDone(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onDone(value);
        if (event.key === "Escape") onDone(null);
      }}
    />
  );
}

type RowProps = {
  page: RailPage;
  open: boolean;
  here: PresentPerson[];
  kids: number;
  expanded: boolean;
  onlyPage: boolean;
  actions: RailActions;
  onToggle: () => void;
  dragging: RailPage | null;
  onDrag: (page: RailPage | null) => void;
};

const below = (el: HTMLElement): Point => ({ left: el.getBoundingClientRect().left + 8, top: el.getBoundingClientRect().bottom + 4 });

function RowMenu({ page, kids, onlyPage, actions, at, onRename, onClose }: {
  page: RailPage; kids: number; onlyPage: boolean; actions: RailActions; at: Point; onRename: () => void; onClose: () => void;
}) {
  const [picker, setPicker] = useState<Point | null>(null);
  if (picker) return <IconPicker at={picker} current={page.icon} onPick={(icon) => actions.icon(page.id, icon)} onClose={onClose} />;
  const archive = kids ? `Archive with ${kids} sub-page${kids > 1 ? "s" : ""}` : "Archive";
  return (
    <Menu at={at} label={`${nameOf(page)} menu`} onClose={onClose}>
      {page.depth === 0 ? <button type="button" onClick={() => { onClose(); actions.add(page.id); }}>Add a sub-page</button> : null}
      <button type="button" onClick={() => { onClose(); onRename(); }}>Rename</button>
      <button type="button" onClick={() => setPicker(at)}>{page.icon ? "Change icon" : "Add icon"}</button>
      <div className="fe-menu-sep" />
      <button type="button" className="is-danger" disabled={onlyPage} title={onlyPage ? "The last page stays" : undefined} onClick={() => { onClose(); actions.archive(page.id); }}>
        {archive}
      </button>
    </Menu>
  );
}

function useRowDrop(page: RailPage, dragging: RailPage | null, actions: RailActions) {
  const [drop, setDrop] = useState<"before" | "after" | null>(null);
  const canDrop = dragging !== null && dragging.id !== page.id && dragging.parentId === page.parentId;
  return {
    drop,
    clear: () => setDrop(null),
    over: (event: DragEvent<HTMLDivElement>) => {
      if (!canDrop) return;
      event.preventDefault();
      const box = event.currentTarget.getBoundingClientRect();
      setDrop(event.clientY < box.top + box.height / 2 ? "before" : "after");
    },
    land: () => {
      if (canDrop) actions.move(dragging.id, page.id, drop === "after");
      setDrop(null);
    },
  };
}

function RowName({ page, open, renaming, actions, onRenamed, onRename }: {
  page: RailPage; open: boolean; renaming: boolean; actions: RailActions; onRenamed: () => void; onRename: () => void;
}) {
  const glyph = page.icon ? <span className="notes-glyph"><Glyph name={page.icon} /></span> : null;
  if (renaming) {
    return (
      <>
        {glyph}
        <RenameField page={page} onDone={(title) => {
          onRenamed();
          if (title !== null && title.trim() !== page.title) actions.rename(page.id, title);
        }} />
      </>
    );
  }
  return (
    <button type="button" className="notes-name" title="Double-click to rename" aria-current={open ? "page" : undefined} onClick={() => actions.open(page.id)} onDoubleClick={onRename}>
      {glyph}
      <span className={page.title ? undefined : "text-ink-faint"}>{nameOf(page)}</span>
    </button>
  );
}

function PageRow({ page, open, here, kids, expanded, onlyPage, actions, onToggle, dragging, onDrag }: RowProps) {
  const [renaming, setRenaming] = useState(false);
  const [menu, setMenu] = useState<Point | null>(null);
  const { drop, clear, over, land } = useRowDrop(page, dragging, actions);
  return (
    <div
      className={cx("notes-row", page.depth === 1 && "is-child", open && "is-open", drop === "before" && "is-drop-before", drop === "after" && "is-drop-after")}
      draggable={!renaming}
      onDragStart={() => onDrag(page)}
      onDragEnd={() => { onDrag(null); clear(); }}
      onDragOver={over}
      onDragLeave={clear}
      onDrop={land}
    >
      {page.depth === 0 ? (
        <button type="button" className={cx("notes-chev", kids === 0 && "is-none")} aria-expanded={expanded} aria-label={expanded ? "Hide sub-pages" : "Show sub-pages"} onClick={onToggle}>
          <Icon name="shut" size={11} />
        </button>
      ) : null}
      <RowName page={page} open={open} renaming={renaming} actions={actions} onRenamed={() => setRenaming(false)} onRename={() => setRenaming(true)} />
      {here.length ? <span className="notes-here"><AvatarRow people={here} size={16} max={3} /></span> : null}
      <span className="notes-acts">
        {page.depth === 0 ? (
          <button type="button" className="notes-tool" aria-label="Add a sub-page" title="Add a sub-page" onClick={() => actions.add(page.id)}><Icon name="plus" /></button>
        ) : null}
        <button type="button" className="notes-tool" aria-label={`${nameOf(page)} menu`} onClick={(event) => setMenu(below(event.currentTarget.closest(".notes-row") as HTMLElement))}>
          <Icon name="dots" />
        </button>
      </span>
      {menu ? <RowMenu page={page} kids={kids} onlyPage={onlyPage} actions={actions} at={menu} onRename={() => setRenaming(true)} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}

function Archived({ pages, actions, now }: { pages: RailArchived[]; actions: RailActions; now: Date }) {
  const [open, setOpen] = useState(false);
  if (!pages.length) return null;
  return (
    <div className="notes-archived">
      <button type="button" className="notes-archived-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name={open ? "open" : "shut"} size={11} />
        <span className="typed">Archived</span>
        <span className="typed text-ink-faint">{pages.length}</span>
      </button>
      {open ? (
        <ul>
          {pages.map((page) => {
            const left = archiveDaysLeft(new Date(page.archivedAt), now);
            return (
              <li key={page.id} className="notes-row is-archived">
                {page.icon ? <span className="notes-glyph"><Glyph name={page.icon} /></span> : null}
                <span className="notes-name-static">{nameOf(page)}</span>
                <span className="typed text-ink-faint">{`${left} day${left === 1 ? "" : "s"} left`}</span>
                <button type="button" className="notes-restore" onClick={() => actions.restore(page.id)}>Restore</button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function PageRail({ pages, archived, openId, byPage, actions, now, error, footer }: {
  pages: RailPage[];
  archived: RailArchived[];
  openId: number;
  byPage: Map<number, PresentPerson[]>;
  actions: RailActions;
  now: Date;
  error: string | null;
  footer?: ReactNode;
}) {
  const openPage = pages.find((page) => page.id === openId);
  const [expanded, setExpanded] = useState(() => new Set(openPage?.parentId ? [openPage.parentId] : pages.filter((p) => p.depth === 0).map((p) => p.id)));
  const [dragging, setDragging] = useState<RailPage | null>(null);
  const full = pagesRefusal(pages.length);
  const tops = pages.filter((page) => page.depth === 0);
  const toggle = (id: number) => setExpanded((now) => {
    const next = new Set(now);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const row = (page: RailPage, kids: number) => (
    <PageRow key={page.id} page={page} open={page.id === openId} here={byPage.get(page.id) ?? []} kids={kids} expanded={expanded.has(page.id)}
      onlyPage={pages.length <= 1 + kids} actions={actions} onToggle={() => toggle(page.id)} dragging={dragging} onDrag={setDragging} />
  );
  return (
    <>
      <ul className="notes-list" aria-label="Pages">
        {tops.map((top) => {
          const kids = pages.filter((page) => page.parentId === top.id);
          return (
            <li key={top.id} className={cx(expanded.has(top.id) && "is-expanded")}>
              {row(top, kids.length)}
              {kids.length ? (
                <div className="notes-kids">
                  <ul>{kids.map((kid) => <li key={kid.id}>{row(kid, 0)}</li>)}</ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="notes-foot">
        {error ? <p className="notes-error" role="alert">{error}</p> : null}
        <button type="button" className="notes-new" disabled={!!full} title={full ?? undefined} onClick={() => actions.add(null)}>
          <Icon name="plus" />
          New page
        </button>
        {footer}
        <Archived pages={archived} actions={actions} now={now} />
      </div>
    </>
  );
}
