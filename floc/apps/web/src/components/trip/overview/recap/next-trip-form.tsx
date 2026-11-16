"use client";

import { ActionForm, SubmitButton } from "@/components/system/client-ui";
import { Field, FieldGroup, Input } from "@/components/system/ui";
import { FriendPicker } from "@/components/social/friend-picker";
import { planNextTrip } from "@/app/trip/[id]/overview/next-trip-actions";

export function NextTripForm({ tripId, others }: { tripId: number; others: { id: string; name: string }[] }) {
  return (
    <ActionForm action={planNextTrip} keepAnswers className="flex flex-col gap-4">
      <input type="hidden" name="tripId" value={tripId} />
      <Field label="Trip name">
        <Input name="name" required autoComplete="off" />
      </Field>
      {others.length > 0 ? (
        <FieldGroup label="Invite">
          <FriendPicker friends={others.map((p) => ({ ...p, avatarIcon: null }))} emptyNote="" ticked unbounded />
        </FieldGroup>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton>Start trip</SubmitButton>
      </div>
    </ActionForm>
  );
}
