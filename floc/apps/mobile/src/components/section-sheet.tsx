/**
 * The section sheet (ticket 299) — the one way between the parts of a trip.
 *
 * WHY A SHEET AND NOT TABS. The day-first direction gives the bottom bar to
 * the app (Explore / Trips / Profile), so a trip's own sections need somewhere
 * else to live. Pulled up from the trip header, they are one list rather than
 * five competing labels.
 *
 * THIS IS THE DIRECTION'S KNOWN WEAK POINT, written down rather than designed
 * around: a drawer gets ignored. Money is what people reach for most, which is
 * why it also sits in the header as a balance chip and does not depend on
 * anybody finding this. If a second section needs that same escape hatch, the
 * sheet is the wrong answer and the direction needs revisiting.
 *
 * NOTHING IS GATED (rule 4). Every row opens. A section with nothing in it
 * says so on its own screen — an empty state teaches what a padlock never
 * could (#126). So a row's figure may be "not set" and the row still works.
 */
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "./theme";
import { fonts, radius, size, space } from "@/lib/theme";

export type Section = {
  /** The route to push, relative to the trip. `""` is the trip's own index. */
  route: string;
  label: string;
  /** The live number beside the label. Never the only thing a row says (#204). */
  figure: string;
  /** A token name when the figure needs weight — an unsettled balance, chiefly. */
  tone?: string;
};

function Row({
  section,
  current,
  onPress,
}: {
  section: Section;
  current: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: current }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: space.md,
        paddingHorizontal: space.md,
        borderRadius: radius.md,
        marginBottom: space.sm,
        backgroundColor: current ? c.peri : c.sheet,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: current ? c["peri-edge"] : c.rule,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          color: current ? c["peri-ink"] : c.ink,
          fontFamily: fonts.sans,
          fontSize: size.body,
          fontWeight: current ? "600" : "400",
        }}
      >
        {section.label}
      </Text>
      <Text
        style={{
          color: section.tone ? c[section.tone] : current ? c["peri-ink"] : c["ink-3"],
          fontFamily: fonts.type,
          fontSize: size.small,
          fontVariant: ["tabular-nums"],
        }}
      >
        {section.figure}
      </Text>
    </Pressable>
  );
}

export function SectionSheet({
  open,
  sections,
  current,
  onClose,
  onGo,
}: {
  open: boolean;
  sections: Section[];
  /** The route already on screen, so the sheet says where you are. */
  current: string;
  onClose: () => void;
  onGo: (route: string) => void;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping the dimmed part dismisses. A sheet that can only be closed by a
          button is a dialog, and this is not one. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        // The scrim is ink at low opacity, not a colour of its own — there is no
        // scrim token, and inventing a hex here would put the two UIs out of step.
        style={{ flex: 1, backgroundColor: c.ink, opacity: 0.28 }}
      />
      <View
        style={{
          backgroundColor: c.sheet,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.rule,
          padding: space.lg,
          paddingTop: space.md,
        }}
      >
        <View
          style={{
            width: 34,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: c["rule-2"],
            alignSelf: "center",
            marginBottom: space.md,
          }}
        />
        <ScrollView>
          {sections.map((section) => (
            <Row
              key={section.route}
              section={section}
              current={section.route === current}
              onPress={() => onGo(section.route)}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
