"use client";

import { useEffect, useId, useState, useTransition, type ReactNode } from "react";

import { removeIdea, undoIdeaOnDays, undoRemoveIdea } from "@/app/trip/[id]/overview/actions";
import { cx } from "@/components/system/ui";
import { formatDate } from "@floc/core/dates/dates";
import { ALL_IDEAS, activeIdeaTab, ideaCategoryTabs, ideasIn, readIdeaCategory } from "@floc/core/trip/idea-categories";
import { sortIdeas, type IdeaRow } from "@floc/core/trip/ideas";
import { IdeaAddField } from "./idea-add-field";
import { IdeaCategoryTrack } from "./idea-category-track";
import { IdeaDaysDialog, type IdeaDay } from "./idea-days-dialog";
import { IdeaLine } from "./idea-line";
import { IdeaNotice, type Notice } from "./idea-notice";
import { IdeasToggle } from "./ideas-toggle";
import { OPEN_IDEAS } from "./open-ideas";
import { useSteadyOrder } from "./use-steady-order";

export function IdeasBox({
  tripId,
  ideas,
  days,
  startOpen,
  waiting,
}: {
  tripId: number;
  ideas: IdeaRow[];
  days: IdeaDay[];
  startOpen: boolean;
  waiting: ReactNode;
}) {
  const foldId = useId();
  const [open, setOpen] = useState(startOpen);
  const [chosenTab, setTab] = useState<string>(ALL_IDEAS);
  const [made, setMade] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [placing, setPlacing] = useState<IdeaRow | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [, start] = useTransition();
  const steady = useSteadyOrder(sortIdeas(ideas, "votes"));
  const tabs = ideaCategoryTabs(ideas, made);
  const tab = activeIdeaTab(tabs, chosenTab);
  const shown = ideasIn(steady, tab);

  useEffect(() => {
    const show = () => setOpen(true);
    const onHash = () => {
      if (window.location.hash === "#ideas") show();
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    window.addEventListener(OPEN_IDEAS, show);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(OPEN_IDEAS, show);
    };
  }, []);

  const makeCategory = (name: string) => {
    const category = readIdeaCategory(name);
    const next = [...made, category];
    setMade(next);
    const found = ideaCategoryTabs(ideas, next).find((t) => t.id.toLowerCase() === category.toLowerCase());
    setTab(found?.id ?? category);
  };

  const added = (title: string, category: string) => {
    if (tab !== ALL_IDEAS && tab.toLowerCase() !== category.toLowerCase()) setTab(category);
    if (!open) setNotice({ text: `Added ${title}` });
  };

  const remove = (idea: IdeaRow) => {
    const form = new FormData();
    form.set("tripId", String(tripId));
    form.set("ideaId", String(idea.id));
    start(async () => {
      try {
        await removeIdea(form);
        setNotice({ text: `Removed ${idea.title}`, undo: () => undoRemoveIdea(tripId, idea.id) });
      } catch {
        setNotice({ text: "That did not save. Try again." });
      }
    });
  };

  const placed = (idea: IdeaRow, day: IdeaDay) => {
    setPlacing(null);
    setNotice({
      text: `Added to ${formatDate(day.date)}`,
      href: `/trip/${tripId}/days?date=${day.date}`,
      undo: () => undoIdeaOnDays(tripId, idea.id),
    });
  };

  return (
    <section id="ideas" aria-label="Ideas" className="scroll-mt-24 rounded-md border border-rule bg-sheet shadow-card">
      <header className="grid items-center gap-x-3.5 gap-y-2 px-4 py-3 max-sm:px-3 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(14rem,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(14rem,22rem)_minmax(0,1fr)]">
        <IdeasToggle open={open} count={ideas.length} controls={foldId} onToggle={() => setOpen(!open)} />
        <IdeaAddField tripId={tripId} tab={tab} tabs={tabs} onAdded={added} />
        <div className={cx("min-w-0 max-lg:col-span-full lg:w-full", !open && "max-lg:hidden lg:invisible")}>
          <IdeaCategoryTrack tabs={tabs} tab={tab} onPick={setTab} onMake={makeCategory} />
        </div>
      </header>

      {notice ? <IdeaNotice key={notice.text} notice={notice} onClear={() => setNotice(null)} /> : null}

      <div id={foldId} inert={!open} className={cx("grid transition-[grid-template-rows] duration-220 ease-(--ease) motion-reduce:transition-none", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="min-h-0 overflow-hidden">
          <ul className="scroll-thin max-h-[26rem] divide-y divide-rule overflow-y-auto border-t border-rule max-sm:max-h-none max-sm:overflow-visible">
            {shown.length === 0 ? <li className="px-4 py-6 text-center text-sm text-ink-soft">Nothing here yet</li> : null}
            {shown.map((idea) => (
              <IdeaLine
                key={idea.id}
                tripId={tripId}
                idea={idea}
                showCategory={tab === ALL_IDEAS}
                editing={editing === idea.id}
                onEdit={setEditing}
                onPlace={() => setPlacing(idea)}
                onRemove={() => remove(idea)}
              />
            ))}
          </ul>
          {waiting}
        </div>
      </div>

      {placing ? (
        <IdeaDaysDialog
          key={placing.id}
          tripId={tripId}
          idea={placing}
          days={days}
          onClose={() => setPlacing(null)}
          onPlaced={(day) => placed(placing, day)}
        />
      ) : null}
    </section>
  );
}
