/**
 * Buying Pro through Apple or Google. The store's word is never the answer:
 * each purchase goes to the server, which asks the store, and only a recorded
 * claim finishes the transaction — an unfinished one replays on the next launch.
 */
import type { StoreClaim, StoreClaimResult } from "@floc/api/port";
import { STORE_PRODUCT_IDS } from "@floc/core/billing/store-products";
import {
  finishTransaction,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
  type Purchase,
} from "expo-iap";
import { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";

import { TextLink } from "../system/ui";
import { ProButton, ProText } from "./pro-parts";
import { space } from "@/lib/theme";
import { claimOf, offerTokenOf, yearlySavingOf } from "@/lib/billing/pro";

const PLATFORM: StoreClaim["platform"] = Platform.OS === "ios" ? "ios" : "android";
const STORE = Platform.OS === "ios" ? "App Store" : "Google Play";
const IN_STORE = Platform.OS === "ios" ? "the App Store" : "Google Play";
const SKUS = Object.values(STORE_PRODUCT_IDS);

const REFUSAL: Record<Exclude<StoreClaimResult, "recorded">, string> = {
  refused: "The store did not confirm that purchase.",
  unavailable: "Floc could not reach the store to check it. Try again soon.",
};

export function ProOffer({
  accountToken,
  claim,
  onClaimed,
}: {
  accountToken: string;
  claim: (input: StoreClaim) => Promise<StoreClaimResult>;
  onClaimed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function settle(purchase: Purchase) {
    const input = claimOf(purchase, PLATFORM);
    if (!input) return;
    const result = await claim(input);
    if (result !== "recorded") {
      setMessage(REFUSAL[result]);
      return;
    }
    await finishTransaction({ purchase, isConsumable: false });
    setMessage(null);
    onClaimed();
  }

  const store = useIAP({
    onPurchaseSuccess: (purchase) => {
      void settle(purchase)
        .catch(() => setMessage(REFUSAL.unavailable))
        .finally(() => setBusy(false));
    },
    onPurchaseError: (error) => {
      setBusy(false);
      if (!isUserCancelledError(error)) setMessage("The purchase did not go through.");
    },
  });

  const asked = useRef(false);
  const { connected, fetchProducts } = store;
  useEffect(() => {
    if (!connected || asked.current) return;
    asked.current = true;
    void fetchProducts({ skus: SKUS, type: "subs" });
  }, [connected, fetchProducts]);

  const monthly = store.subscriptions.find((p) => p.id === STORE_PRODUCT_IDS.monthly);
  const yearly = store.subscriptions.find((p) => p.id === STORE_PRODUCT_IDS.yearly);
  const saving = yearlySavingOf(monthly, yearly);

  function buy(product: typeof monthly) {
    if (!product) return;
    setBusy(true);
    setMessage(null);
    const offerToken = offerTokenOf(product);
    store
      .requestPurchase({
        type: "subs",
        request: {
          apple: { sku: product.id, appAccountToken: accountToken },
          google: {
            skus: [product.id],
            obfuscatedAccountId: accountToken,
            subscriptionOffers: offerToken ? [{ sku: product.id, offerToken }] : null,
          },
        },
      })
      .catch(() => {
        setBusy(false);
        setMessage("The purchase did not go through.");
      });
  }

  async function restore() {
    setBusy(true);
    setMessage(null);
    try {
      const ours = (await getAvailablePurchases()).filter((p) => claimOf(p, PLATFORM));
      if (ours.length === 0) setMessage(`No Floc Pro purchase on this ${STORE} account.`);
      for (const purchase of ours) await settle(purchase);
    } catch {
      setMessage(REFUSAL.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.sm }}>
      {yearly || monthly ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>
          {yearly ? (
            <ProButton
              lead
              label={`${yearly.displayPrice} a year${saving ? ` · save ${saving}%` : ""}`}
              disabled={busy}
              onPress={() => buy(yearly)}
            />
          ) : null}
          {monthly ? (
            <ProButton label={`${monthly.displayPrice} a month`} disabled={busy} onPress={() => buy(monthly)} />
          ) : null}
        </View>
      ) : (
        <ProText quiet>{connected ? `Pro is not on sale in ${IN_STORE} yet.` : `Waiting for ${IN_STORE}…`}</ProText>
      )}
      {message ? <ProText>{message}</ProText> : null}
      {/* Apple requires the renewal terms beside the price. */}
      <ProText quiet>{`Renews automatically until you cancel in your ${STORE} settings.`}</ProText>
      <TextLink label="Restore a purchase" disabled={busy} onPress={() => void restore()} />
    </View>
  );
}
