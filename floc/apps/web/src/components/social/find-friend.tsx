"use client";

import { useState, useTransition } from "react";
import type { FoundFriend, FriendSearch } from "@floc/api/port";

import { findFriends, requestFriendById, requestFriendByCode } from "@/app/friends/actions";
import { PersonRow } from "@/components/auth/account-ui";
import { Avatar, Badge, Button, Input } from "@/components/system/ui";
import { SubmitButton } from "@/components/system/client-ui";

const STATE_BADGE = {
  friends: <Badge tone="agreed">Friends</Badge>,
  outgoing: <Badge tone="neutral">requested — pending</Badge>,
  incoming: <Badge tone="open">wants to be friends</Badge>,
} as const;

function FoundRow({
  person,
  ask,
}: {
  person: FoundFriend;
  ask: (formData: FormData) => Promise<void>;
}) {
  return (
    <PersonRow>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={person.name} icon={person.avatarIcon} />
        <span className="min-w-0 truncate text-sm text-ink">{person.name}</span>
      </div>
      {person.state === "none" ? (
        <form action={ask}>
          <SubmitButton variant="secondary" pendingLabel="Asking…">
            Add friend
          </SubmitButton>
        </form>
      ) : (
        STATE_BADGE[person.state]
      )}
    </PersonRow>
  );
}

function Results({
  result,
  typedAddress,
  askById,
  askByCode,
}: {
  result: FriendSearch;
  typedAddress: boolean;
  askById: (person: FoundFriend) => (formData: FormData) => Promise<void>;
  askByCode: (code: string) => (formData: FormData) => Promise<void>;
}) {
  if (result.kind === "invalid") {
    return (
      <p className="text-sm text-ink-soft">
        {typedAddress
          ? "Floc does not look people up by email address. Ask them for their friend code."
          : "Type at least two letters of a name, or a friend code."}
      </p>
    );
  }
  if (result.kind === "code") {
    if (!result.person) return <p className="text-sm text-ink-soft">Nobody has that code.</p>;
    return (
      <ul>
        <FoundRow person={result.person} ask={askByCode(result.code)} />
      </ul>
    );
  }
  if (result.people.length === 0) {
    return <p className="text-sm text-ink-soft">Nobody by that name among people you can reach.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {result.people.map((person) => (
        <FoundRow key={person.id} person={person} ask={askById(person)} />
      ))}
    </ul>
  );
}

/** Results come from an action, not the URL: what is typed here stays out of logs and history. */
export function FindFriend() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [result, setResult] = useState<FriendSearch | null>(null);
  const [pending, startTransition] = useTransition();

  const search = (text: string) =>
    startTransition(async () => {
      setSearched(text);
      setResult(await findFriends(text));
    });

  const thenSearchAgain =
    (send: (formData: FormData) => Promise<unknown>, fields: Record<string, string>) =>
    async (formData: FormData) => {
      for (const [key, value] of Object.entries(fields)) formData.set(key, value);
      await send(formData);
      search(searched);
    };

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
      >
        <Input
          aria-label="Name or friend code"
          placeholder="Name or friend code"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Finding…" : "Find"}
        </Button>
      </form>
      {result ? (
        <Results
          result={result}
          typedAddress={searched.includes("@")}
          askById={(person) => thenSearchAgain(requestFriendById, { targetId: person.id })}
          askByCode={(code) => thenSearchAgain(requestFriendByCode, { code })}
        />
      ) : null}
    </div>
  );
}
