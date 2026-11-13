import { bookingForwardWords } from "@floc/core/documents/booking/booking-inbox";
import { useQuery } from "@tanstack/react-query";
import { Share, View } from "react-native";

import { ShareGlyph } from "@/components/system/glyphs";
import { Button, Label } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

/**
 * The quiet way in for a booking mail (#559): one shared address behind one button.
 * Why the share sheet: it holds Copy and every mail app, with no native clipboard module (as the invite link).
 * Why the line under it: a mail from another address is not kept, and nothing else on the phone says so.
 */
export function ForwardBookings({ tripId }: { tripId: number }) {
  const inbox = useQuery(trpc.files.inboxAddress.queryOptions({ tripId }, { enabled: Number.isFinite(tripId) }));
  const address = inbox.data;
  if (!address) return null;

  return (
    <View style={{ alignItems: "center", gap: space.xs }} testID="files-forward-bookings">
      <Button
        label="Forward bookings"
        variant="quiet"
        fit="small"
        icon={(ink) => <ShareGlyph color={ink} />}
        onPress={() => void Share.share({ message: address })}
      />
      <Label>{bookingForwardWords}</Label>
    </View>
  );
}
