import type { FoundFriend, FriendSearch } from "@floc/api/port";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { View } from "react-native";

import { PersonRow } from "../trip/person-row";
import { TickGlyph } from "../system/glyphs";
import { Body, Button, Pill, SearchField, SectionTitle } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const STATE_PILL = {
  friends: <Pill word="Friends" tone="pastel-green" />,
  outgoing: <Pill word="Asked" tone="pastel-blue" />,
  incoming: <Pill word="Wants to be friends" tone="pastel-yellow" />,
} as const;

function Found({ person, onAsk, busy }: { person: FoundFriend; onAsk: () => void; busy: boolean }) {
  return (
    <PersonRow name={person.name}>
      {person.state === "none" ? (
        <Button label="Add" fit="small" variant="quiet" busy={busy} onPress={onAsk} />
      ) : (
        STATE_PILL[person.state]
      )}
    </PersonRow>
  );
}

function Outcome({
  result,
  typedAddress,
  ask,
  busy,
}: {
  result: FriendSearch;
  typedAddress: boolean;
  ask: (person: FoundFriend, code?: string) => void;
  busy: boolean;
}) {
  if (result.kind === "invalid") {
    return (
      <Body tone="ink-3">
        {typedAddress
          ? "Floc does not look people up by email address. Ask them for their friend tag."
          : "Enter at least two letters of a name or a full friend tag."}
      </Body>
    );
  }
  if (result.kind === "code") {
    return result.person ? (
      <Found person={result.person} busy={busy} onAsk={() => ask(result.person!, result.code)} />
    ) : (
      <Body tone="ink-3">{result.limited ? "Too many tag searches. Try again in a minute." : "Nobody has that friend tag."}</Body>
    );
  }
  if (result.people.length === 0) {
    return <Body tone="ink-3">Nobody by that name among people you can reach.</Body>;
  }
  return (
    <View style={{ gap: space.sm }}>
      {result.people.map((person) => (
        <Found key={person.id} person={person} busy={busy} onAsk={() => ask(person)} />
      ))}
    </View>
  );
}

function CopyTag({ tag }: { tag: string }) {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const reset = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reset.current), []);

  const copy = async () => {
    setRevealed(true);
    let copied = false;
    try {
      copied = await Clipboard.setStringAsync(tag);
    } catch {
      copied = false;
    }
    setStatus(copied ? "copied" : "failed");
    clearTimeout(reset.current);
    reset.current = setTimeout(() => setStatus("idle"), copied ? 1300 : 2500);
  };

  const label = status === "failed" ? "Copy failed" : revealed ? tag : "Copy friend tag";
  return (
    <Button
      label={label}
      variant="quiet"
      icon={status === "copied" ? (ink) => <TickGlyph color={ink} /> : undefined}
      onPress={copy}
    />
  );
}

export function FindFriend({ tag }: { tag: string }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const find = useMutation(trpc.friends.find.mutationOptions());

  const again = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.friends.list.queryKey() });
      find.mutate({ query: searched });
    },
  };
  const byId = useMutation({ ...trpc.friends.request.mutationOptions(), ...again });
  const byCode = useMutation({ ...trpc.friends.requestByCode.mutationOptions(), ...again });

  const search = () => {
    if (!query.trim()) return;
    setSearched(query);
    find.mutate({ query });
  };

  return (
    <View style={{ gap: space.sm }}>
      <SectionTitle>Name or full friend tag</SectionTitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <SearchField
            label="Name or full friend tag"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
        <CopyTag tag={tag} />
      </View>
      {find.data ? (
        <Outcome
          result={find.data}
          typedAddress={searched.includes("@")}
          busy={byId.isPending || byCode.isPending}
          ask={(person, personCode) =>
            personCode
              ? byCode.mutate({ code: personCode })
              : byId.mutate({ userId: person.id })
          }
        />
      ) : null}
    </View>
  );
}
