/**
 * The Pro block in Settings — the web's Billing panel, in the one colour the
 * product pays for. Gold marks the paid perk; it never stands in for blue.
 */
import type { BillingStatus, StoreClaim, StoreClaimResult } from "@floc/api/port";
import Constants from "expo-constants";
import { deepLinkToSubscriptions } from "expo-iap";
import { StyleSheet, Text, View } from "react-native";

import { ProStarGlyph } from "../system/glyphs";
import { useTheme } from "../system/theme";
import { ProOffer } from "./pro-offer";
import { ProButton, ProText } from "./pro-parts";
import { fonts, radius, size, space } from "@/lib/theme";
import { proView } from "@/lib/billing/pro";

const HELD_ELSEWHERE = {
  elsewhere: "Bought on the web, so it is managed there.",
  none: "This one was granted rather than bought, so there is nothing to bill or cancel.",
} as const;

export function ProSection({
  status,
  claim,
  onClaimed,
}: {
  status: BillingStatus;
  claim: (input: StoreClaim) => Promise<StoreClaimResult>;
  onClaimed: () => void;
}) {
  const { c } = useTheme();
  const view = proView(status);
  if (view.kind === "hidden") return null;

  const manage = () =>
    void deepLinkToSubscriptions({
      skuAndroid: status.subscription?.storeProductId ?? undefined,
      packageNameAndroid: Constants.expoConfig?.android?.package,
    }).catch(() => undefined);

  return (
    <View
      style={{
        backgroundColor: c.pro,
        borderColor: c["pro-edge"],
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: space.lg,
        gap: space.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <ProStarGlyph color={c["pro-gold"]} />
        <Text style={{ color: c["pro-ink"], fontFamily: fonts.display, fontSize: size.heading }}>Floc Pro</Text>
      </View>

      {view.kind === "pro" ? (
        <>
          <ProText>You&apos;re on Pro. {view.line}</ProText>
          {view.manage === "app_store" || view.manage === "play" ? (
            <ProButton label="Manage or cancel" onPress={manage} />
          ) : (
            <ProText quiet>{HELD_ELSEWHERE[view.manage]}</ProText>
          )}
        </>
      ) : (
        <>
          <ProText>
            {view.line ? `${view.line} ` : ""}Pro adds the weather forecast on your dates, a packing list filled
            in for you, and flight and stay searches with your place and dates filled in. One of you paying covers everyone on a trip.
          </ProText>
          <ProOffer accountToken={status.accountToken} claim={claim} onClaimed={onClaimed} />
        </>
      )}
    </View>
  );
}
