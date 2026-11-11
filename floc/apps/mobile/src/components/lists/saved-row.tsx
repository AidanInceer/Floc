/**
 * One Saved row and its section (#467, A3), shared by your Saved tab and a friend's profile (#544). A row opens from its
 * title and figures; Start trip, in pen, shares the figures' line.
 */
import { savedTooLabel, type FriendFace } from "@floc/core/people/shared-saves";
import { whoTone } from "@floc/core/people/who";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FaceStack } from "@/components/system/face-stack";
import { useTheme } from "@/components/system/theme";
import { Card, SectionTitle } from "@/components/system/ui";
import { fonts, size, space } from "@/lib/theme";

export function SavedSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
        <SectionTitle>{title}</SectionTitle>
        <Text style={{ color: c["ink-3"], fontFamily: fonts.type, fontSize: size.small }}>{count}</Text>
      </View>
      <Card style={{ padding: 0, gap: 0 }}>{children}</Card>
    </View>
  );
}

export function SavedRow({
  first,
  tags,
  title,
  figures,
  mark,
  heart,
  onOpen,
  onStart,
}: {
  first: boolean;
  tags?: React.ReactNode;
  title: string;
  figures: string;
  /** Friends' faces, or You both (#544). */
  mark?: React.ReactNode;
  heart?: React.ReactNode;
  onOpen: () => void;
  onStart: () => void;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: space.md,
        paddingHorizontal: space.lg,
        paddingTop: space.md,
        paddingBottom: space.xs,
        borderTopColor: c.rule,
        borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
      }}
    >
      <View style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${figures}`} onPress={onOpen} style={({ pressed }) => ({ gap: space.xs + 2, paddingTop: space.xs, opacity: pressed ? 0.6 : 1 })}>
          {tags}
          <Text style={{ color: c.ink, fontFamily: fonts.sansBold, fontSize: size.body }}>{title}</Text>
        </Pressable>
        {/* Why: Start trip shares the figures' line (A3, #467), at full press height and clear of the heart above. */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          <Pressable accessible={false} onPress={onOpen} style={{ flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={{ color: c["ink-2"], fontFamily: fonts.type, fontSize: size.small, fontVariant: ["tabular-nums"] }}>{figures}</Text>
            {mark}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Start trip from ${title}`}
            onPress={onStart}
            style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingLeft: space.sm, opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ color: c.pen, fontFamily: fonts.sansBold, fontSize: size.small }}>Start trip</Text>
          </Pressable>
        </View>
      </View>
      {heart}
    </View>
  );
}

/** The friends who saved this too, as initials (#544). Only friends who share their list with you reach here (ADR-045). */
export function FriendFaces({ faces }: { faces: FriendFace[] | undefined }) {
  if (!faces?.length) return null;
  return (
    <FaceStack
      diameter={20}
      faces={faces.map((f) => ({ userId: f.id, name: f.name, tone: whoTone(f.name) }))}
      label={savedTooLabel(faces.map((f) => f.name))}
    />
  );
}

/** A mono word on a friend's row for what you saved too (#544). */
export function YouBoth() {
  const { c } = useTheme();
  return <Text style={{ color: c.ink, fontFamily: fonts.type, fontSize: size.small }}>You both</Text>;
}
