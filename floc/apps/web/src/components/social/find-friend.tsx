"use client";

import { useState, useTransition } from "react";
import type { FoundFriend, FriendSearch } from "@floc/api/port";

import { findFriends, requestFriendById, requestFriendByCode } from "@/app/friends/actions";
import { PersonRow } from "@/components/auth/account-ui";
import { Avatar, Badge } from "@/components/system/ui";
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
      {/* One field, submitted with Enter — the form's implicit submit, so there is no Find button to aim at. */}
      <form
        className="flex h-10 items-center gap-2 rounded-full border border-rule-strong bg-sheet px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-pen"
        onSubmit={(event) => {
          event.preventDefault();
          search(query);
        }}
      >
        <svg
          viewBox="0 0 14 14"
          width={13}
          height={13}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinecap="round"
          aria-hidden
          className="shrink-0 text-ink-soft"
        >
          <circle cx="6" cy="6" r="3.8" />
          <path d="M8.8 8.8L12 12" />
        </svg>
        <input
          type="search"
          aria-label="Find someone by name or code"
          placeholder="Find someone by name or code"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {pending ? <span className="shrink-0 text-xs text-ink-soft">Finding…</span> : null}
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
