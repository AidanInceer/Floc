/**
 * Feedback to Floc from the phone (#271). Why the words are held here: a failed send must keep what was typed,
 * so only `sent` clears the box.
 */
import { FEEDBACK_PROBLEMS, FEEDBACK_SENT, type FeedbackResult } from "@floc/core/feedback/feedback";
import { TEXT_CAPS } from "@floc/core/text/text";
import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { usePathname } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";

import { Body, Button, TextBox } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

export function SettingsFeedback() {
  const page = usePathname();
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const send = useMutation({
    ...trpc.feedback.send.mutationOptions(),
    onError: () => setResult("failed"),
    onSuccess: (next) => {
      setResult(next);
      if (next === "sent") setMessage("");
    },
  });

  return (
    <View style={{ gap: space.sm }}>
      <TextBox
        label="Feedback"
        testID="feedback-message"
        value={message}
        onChangeText={(next) => {
          setMessage(next);
          setResult(null);
        }}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        maxLength={TEXT_CAPS.feedback}
      />
      {result && result !== "sent" ? <Body tone="red">{FEEDBACK_PROBLEMS[result]}</Body> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <Button
        label="Send"
        fit="small"
        busy={send.isPending}
        disabled={!message.trim()}
        onPress={() =>
          send.mutate({
            message,
            page,
            surface: Platform.OS === "ios" ? "ios" : "android",
            appVersion: Constants.expoConfig?.version ?? "unknown",
          })
        }
      />
      {result === "sent" ? <Body tone="ink-3">{FEEDBACK_SENT}</Body> : null}
      </View>
    </View>
  );
}
