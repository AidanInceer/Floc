import { ALL_IDEAS, activeIdeaTab, ideaCategoryTabs, ideasIn, readIdeaCategory } from "@floc/core/trip/idea-categories";
import type { IdeaRow } from "@floc/core/trip/ideas";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChevronGlyph } from "../../system/glyphs";
import { useTheme } from "../../system/theme";
import { Body, Card, Failed, Loading, SectionTitle } from "../../system/ui";
import { NudgeLine } from "../nudge/nudge-chips";
import { IdeaAddBox } from "./idea-add-box";
import { IdeaCategoryChips } from "./idea-category-chips";
import { IdeaDaysSheet, type IdeaDay } from "./idea-days-sheet";
import { IdeaLine } from "./idea-line";
import { IdeaMenuSheet } from "./idea-menu-sheet";
import { useIdeaActions, type IdeaNotice } from "./use-idea-actions";
import { useSteadyIdeas } from "./use-steady-ideas";
import { trpc } from "@/lib/api";
import { fonts, size, space } from "@/lib/theme";

export function IdeasSection({ tripId, startOpen, days }: { tripId: number; startOpen: boolean; days: IdeaDay[] }) {
  const ideas = useQuery(trpc.ideas.list.queryOptions({ tripId }));
  const rows = useMemo<IdeaRow[]>(
    () => (ideas.data ?? []).map((idea) => ({
      id: idea.id,
      title: idea.title,
      category: idea.category,
      createdAt: new Date(idea.createdAt),
      authorId: idea.createdBy,
      authorName: idea.authorName,
      authorAvatarIcon: idea.authorAvatarIcon,
      votes: idea.votes,
      mine: idea.mine,
    })),
    [ideas.data],
  );

  if (ideas.isPending) return <Loading />;
  if (ideas.isError) return <Failed onRetry={() => ideas.refetch()} />;
  return <IdeasBox tripId={tripId} rows={rows} startOpen={startOpen} days={days} />;
}

function IdeasBox({ tripId, rows, startOpen, days }: { tripId: number; rows: IdeaRow[]; startOpen: boolean; days: IdeaDay[] }) {
  const { c } = useTheme();
  const router = useRouter();
  const actions = useIdeaActions(tripId);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const [chosenTab, setTab] = useState<string>(ALL_IDEAS);
  const [made, setMade] = useState<string[]>([]);
  const [placing, setPlacing] = useState<IdeaRow | null>(null);
  const [menuFor, setMenuFor] = useState<IdeaRow | null>(null);
  const open = toggled ?? startOpen;
  const steady = useSteadyIdeas(rows);
  const tabs = ideaCategoryTabs(rows, made);
  const tab = activeIdeaTab(tabs, chosenTab);
  const shown = ideasIn(steady, tab);

  const makeCategory = (name: string) => {
    const category = readIdeaCategory(name);
    const next = [...made, category];
    setMade(next);
    setTab(ideaCategoryTabs(rows, next).find((t) => t.id.toLowerCase() === category.toLowerCase())?.id ?? category);
  };

  const add = (title: string, category: string, done: () => void) => {
    actions.add(title, category, () => {
      done();
      setToggled(true);
    });
    if (tab !== ALL_IDEAS && tab.toLowerCase() !== category.toLowerCase()) setTab(category);
  };

  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Ideas, ${rows.length === 1 ? "1 idea" : `${rows.length} ideas`}`}
        onPress={() => setToggled(!open)}
        hitSlop={6}
        style={{ minHeight: 34, flexDirection: "row", alignItems: "center", gap: space.sm }}
      >
        <View style={{ transform: [{ rotate: open ? "0deg" : "-90deg" }] }}>
          <ChevronGlyph color={c["ink-2"]} />
        </View>
        <SectionTitle>Ideas</SectionTitle>
        {open ? null : <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.label }}>{rows.length === 1 ? "1 idea" : `${rows.length} ideas`}</Text>}
      </Pressable>

      <IdeaAddBox tab={tab} tabs={tabs} busy={actions.adding} onAdd={add} />
      {actions.notice ? <NoticeLine notice={actions.notice} /> : null}

      {open ? (
        <View style={{ gap: space.sm }}>
          <IdeaCategoryChips tabs={tabs} tab={tab} onPick={setTab} onMake={makeCategory} />
          <View>
            {shown.length === 0 ? <Body tone="ink-2">Nothing here yet</Body> : null}
            {shown.map((idea) => (
              <IdeaLine
                key={idea.id}
                idea={idea}
                showCategory={tab === ALL_IDEAS}
                onVote={() => actions.vote(idea.id)}
                onPlace={() => setPlacing(idea)}
                onMore={() => setMenuFor(idea)}
              />
            ))}
          </View>
          <IdeasWaiting tripId={tripId} />
        </View>
      ) : null}

      {placing ? (
        <IdeaDaysSheet
          title={placing.title}
          days={days}
          busy={actions.placing}
          onClose={() => setPlacing(null)}
          onDates={() => {
            setPlacing(null);
            router.push(`/trip/${tripId}/dates` as never);
          }}
          onAdd={(dayId, time, label, date) =>
            actions.place(placing.id, dayId, time, label, () => router.push({ pathname: "/trip/[id]/days", params: { id: tripId, date } }), () => setPlacing(null))
          }
        />
      ) : null}

      {menuFor ? (
        <IdeaMenuSheet
          title={menuFor.title}
          onClose={() => setMenuFor(null)}
          onRename={(title) => actions.rename(menuFor.id, title)}
          onRemove={() => actions.remove(menuFor.id, menuFor.title)}
        />
      ) : null}
    </Card>
  );
}

function IdeasWaiting({ tripId }: { tripId: number }) {
  const { c } = useTheme();
  const nudges = useQuery(trpc.nudges.targets.queryOptions({ tripId }));
  const unvoted = nudges.data?.ideas ?? [];
  if (unvoted.length === 0) return null;
  return (
    <View style={{ paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
      <NudgeLine tripId={tripId} task="ideas" people={unvoted} />
    </View>
  );
}

function NoticeLine({ notice }: { notice: IdeaNotice }) {
  const { c } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <Text numberOfLines={1} style={{ flex: 1, color: c.ink, fontFamily: fonts.sans, fontSize: size.small }}>{notice.text}</Text>
      {notice.see ? (
        <Pressable accessibilityRole="link" accessibilityLabel="See it on Days" onPress={notice.see} hitSlop={8}>
          <Text style={{ color: c["pen-deep"], fontFamily: fonts.sans, fontSize: size.small, textDecorationLine: "underline" }}>See it on Days</Text>
        </Pressable>
      ) : null}
      {notice.undo ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Undo" onPress={notice.undo} hitSlop={8}>
          <Text style={{ color: c["pen-deep"], fontFamily: fonts.sansBold, fontSize: size.small, textDecorationLine: "underline" }}>Undo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
