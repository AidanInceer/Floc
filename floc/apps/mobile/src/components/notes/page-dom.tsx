"use dom";

import "@floc/editor/editor.css";

import { useDOMImperativeHandle, type DOMImperativeFactory, type DOMProps } from "expo/dom";
import { useEffect, useMemo, useRef, type Ref } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { PageEditor } from "@floc/editor/view/page-editor";
import { PageTop } from "@floc/editor/view/page-top";
import type { PageThread } from "@floc/editor/view/comments";
import type { PageIcon } from "@floc/core/notes/pages/page-icons";
import type { LinkKind, TripLinkItem } from "@floc/core/notes/pages/trip-links";

import { RedHatDisplay_800ExtraBold } from "@expo-google-fonts/red-hat-display/800ExtraBold";
import { RedHatMono_400Regular } from "@expo-google-fonts/red-hat-mono/400Regular";
import { RedHatText_400Regular } from "@expo-google-fonts/red-hat-text/400Regular";
import { RedHatText_600SemiBold } from "@expo-google-fonts/red-hat-text/600SemiBold";

import { pageCss, type FontFiles } from "@/lib/notes/page-css";
import { FROM_APP, sendChanges, takeChange, takeOthers } from "@/lib/notes/relay";

const url = (asset: unknown): string | undefined => {
  if (typeof asset === "string") return asset;
  const held = asset as { uri?: unknown; default?: unknown } | null;
  return typeof held?.uri === "string" ? held.uri : typeof held?.default === "string" ? held.default : undefined;
};

const FONTS: FontFiles = {
  display: url(RedHatDisplay_800ExtraBold),
  sans: url(RedHatText_400Regular),
  sansBold: url(RedHatText_600SemiBold),
  type: url(RedHatMono_400Regular),
};

export type PageHandle = DOMImperativeFactory;

type Props = {
  dom?: DOMProps;
  ref: Ref<PageHandle>;
  start: string;
  theme: "light" | "dark";
  me: { id: string; name: string };
  foldKey: string | null;
  title: string;
  icon: PageIcon | null;
  links: TripLinkItem[];
  threads: PageThread[];
  onReady: () => Promise<{ page: string; others: string | null } | null>;
  onChange: (update: string) => Promise<void>;
  onPresence: (state: string) => Promise<void>;
  onOpenLink: (kind: LinkKind, id: number) => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onIcon: (icon: PageIcon | null) => Promise<void>;
  onStartThread: (body: string) => Promise<number | { error: string }>;
  onReply: (threadId: number, body: string) => Promise<string | null>;
  onResolve: (threadId: number) => Promise<void>;
};

export default function PageDom(props: Props) {
  const doc = useMemo(() => {
    const made = new Y.Doc();
    takeChange(made, props.start, FROM_APP);
    return made;
  }, []);
  const awareness = useMemo(() => new Awareness(doc), [doc]);
  const handle = useRef<{ focusStart: () => void } | null>(null);
  const { onChange, onPresence } = props;

  useDOMImperativeHandle(props.ref, () => ({
    change: (update) => takeChange(doc, String(update), FROM_APP),
    others: (update) => takeOthers(awareness, String(update)),
  }), [doc, awareness]);

  useEffect(() => sendChanges(doc, FROM_APP, (update) => { void onChange(update); }), [doc, onChange]);

  useEffect(() => {
    void props.onReady().then((start) => {
      if (!start) return;
      takeChange(doc, start.page, FROM_APP);
      if (start.others) takeOthers(awareness, start.others);
    });
  }, []);

  useEffect(() => {
    const mine = ({ added, updated }: { added: number[]; updated: number[] }) => {
      if (![...added, ...updated].includes(awareness.clientID)) return;
      void onPresence(JSON.stringify(awareness.getLocalState()));
    };
    awareness.on("change", mine);
    return () => {
      awareness.off("change", mine);
      awareness.destroy();
    };
  }, [awareness, onPresence]);

  return (
    <>
      <style>{pageCss(props.theme, FONTS)}</style>
      <div style={{ padding: "4px 16px 72px 28px" }}>
        <PageTop touch title={props.title} icon={props.icon} onRename={(title) => { void props.onRename(title); }} onIcon={(icon) => { void props.onIcon(icon); }} onDown={() => handle.current?.focusStart()} />
        <PageEditor
          touch
          doc={doc}
          awareness={awareness}
          me={props.me}
          foldKey={props.foldKey}
          links={props.links}
          threads={props.threads}
          handle={handle}
          onOpenLink={(kind, id) => { void props.onOpenLink(kind, id); }}
          onStartThread={props.onStartThread}
          onReply={props.onReply}
          onResolve={props.onResolve}
        />
      </div>
    </>
  );
}
