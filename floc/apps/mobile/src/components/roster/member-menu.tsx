import { Alert, Pressable, View } from "react-native";

import { Sheet } from "@/components/system/sheet";
import { useTheme } from "@/components/system/theme";
import { Body, Heading } from "@/components/system/ui";
import type { MemberAction } from "@/lib/roster/member-actions";
import { space } from "@/lib/theme";

const LABELS: Record<MemberAction, string> = { profile: "View profile", promote: "Make admin", remove: "Remove from trip" };

export function MemberMenu({ name, actions, onClose, onPick }: {
  name: string | null;
  actions: MemberAction[];
  onClose: () => void;
  onPick: (action: MemberAction) => void;
}) {
  const { c } = useTheme();
  return (
    <Sheet open={name !== null} onClose={onClose}>
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Heading>{name ?? ""}</Heading>
      </View>
      {actions.map((action) => (
        <Pressable
          key={action}
          accessibilityRole="button"
          accessibilityLabel={LABELS[action]}
          onPress={() => onPick(action)}
          style={({ pressed }) => ({ minHeight: 48, justifyContent: "center", paddingHorizontal: space.lg, backgroundColor: pressed ? c["sheet-2"] : "transparent" })}
        >
          <Body tone={action === "remove" ? "red" : "ink"}>{LABELS[action]}</Body>
        </Pressable>
      ))}
    </Sheet>
  );
}

export function confirmRemove(name: string, onConfirm: () => void) {
  Alert.alert(`Remove ${name} from this trip?`, "They lose access. Anything they have already posted stays.", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove them", style: "destructive", onPress: onConfirm },
  ]);
}
