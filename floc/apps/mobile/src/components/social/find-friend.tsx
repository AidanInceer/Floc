/**
 * Find someone to befriend by name or friend code (#360) — the phone's half of
 * the web's "Find someone" panel. Never by email address: any answer to one
 * would say whether it is an account.
 */
import type { FoundFriend, FriendSearch } from "@floc/api/port";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Share, View } from "react-native";

import { PersonRow } from "../trip/person-row";
import { ShareGlyph } from "../system/glyphs";
import { Body, Button, Label, Pill, SearchField } from "../system/ui";
import { trpc } from "@/lib/api";
import { space } from "@/lib/theme";

const STATE_PILL = {
  friends: <Pill word="Friends" tone="pastel-green" />,
  outgoing: <Pill word="Asked" tone="pastel-blue" />,
  incoming: <Pill word="Wants to be friends" tone="pastel-yellow" />,
} as const;

function Found({ person, onAsk, busy }: { person: FoundFriend; onAsk: () => void; busy: boolean }) {
  return (
    <PersonRow name={person.name} avatarIcon={person.avatarIcon}>
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
          ? "Floc does not look people up by email address. Ask them for their friend code."
          : "Type at least two letters of a name, or a friend code."}
      </Body>
    );
  }
  if (result.kind === "code") {
    return result.person ? (
      <Found person={result.person} busy={busy} onAsk={() => ask(result.person!, result.code)} />
    ) : (
      <Body tone="ink-3">Nobody has that code.</Body>
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

export function FindFriend({ code }: { code: string }) {
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
      <Label>Find someone</Label>
      <SearchField
        placeholder="Name or friend code"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
        returnKeyType="search"
        autoCapitalize="none"
      />
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Body tone="ink-3">Your code {code}</Body>
        <Button
          label="Share"
          fit="small"
          variant="quiet"
          icon={(ink) => <ShareGlyph color={ink} />}
          onPress={() => void Share.share({ message: code })}
        />
      </View>
    </View>
  );
}
