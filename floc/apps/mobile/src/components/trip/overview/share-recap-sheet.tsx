/** The recap picture before it leaves (ADR-045): a preview, Light or Dark (starting on the app's own), then the phone's share sheet. */
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

import { Sheet } from "../../system/sheet";
import { ShareGlyph } from "../../system/glyphs";
import { Body, Button, Heading, Segmented } from "../../system/ui";
import { useTheme } from "../../system/theme";
import { authHeaders } from "@/lib/auth";
import { radius, space } from "@/lib/theme";
import { recapPictureUrl, shareRecapPicture, type Look } from "./share-recap";

const LOOKS = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }] as const;

export function ShareRecapSheet({ open, onClose, tripId, tripName }: { open: boolean; onClose: () => void; tripId: number; tripName: string }) {
  const { theme, c } = useTheme();
  const [look, setLook] = useState<Look>(theme);
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  useEffect(() => {
    if (open) void authHeaders().then(setHeaders);
  }, [open]);

  async function share() {
    setState("busy");
    try {
      await shareRecapPicture(tripId, tripName, look);
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      footer={<Button label="Share" busy={state === "busy"} onPress={() => void share()} icon={(ink) => <ShareGlyph color={ink} />} />}
    >
      <View style={{ gap: space.lg, alignItems: "center" }}>
        <View style={{ alignSelf: "stretch" }}>
          <Heading>{`Share ${tripName}`}</Heading>
        </View>
        <Segmented options={LOOKS} value={look} onChange={(l) => { setState("idle"); setLook(l); }} />
        {headers ? (
          <Image
            accessibilityLabel={`${tripName}: the route, its places and nights`}
            source={{ uri: recapPictureUrl(tripId, look), headers }}
            onError={() => setState("failed")}
            style={{ width: 216, height: 270, borderRadius: radius.md, borderWidth: 1, borderColor: c.rule }}
          />
        ) : null}
        {state === "failed" ? <Body tone="ink-2">The picture could not be made. Try again.</Body> : null}
      </View>
    </Sheet>
  );
}
