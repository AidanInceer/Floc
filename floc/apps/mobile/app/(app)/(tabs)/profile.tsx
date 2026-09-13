/**
 * You — the face you curate (ticket 302, direction C).
 *
 * THE SPLIT THE WEB HAS, KEPT WHOLE. `/profile` is what you curate and
 * `/settings` is what you configure, and this screen used to be both at once
 * with a rule drawn between them. A rule is not a split: the theme buttons
 * were still the tallest thing on a page about who you are. So Settings is its
 * own screen now, reached by one row at the foot, exactly as on the web.
 *
 * THE FACE IS THE CONTROL. Your name and picture are edited by tapping the
 * card, not by a button parked under it — the same move the trip header makes,
 * for the same reason: a rename is rare, and a permanent form for a rare job
 * is furniture.
 *
 * THE COUNTS ARE DERIVED (#95). Been and want-to-go come off the trips you are
 * on, read fresh, never stored — so this can never disagree with the web.
 *
 * THE MAP IS EDITABLE HERE NOW. It used to say "change them on the website",
 * which is a section explaining why it is not one. Trip marks are still
 * derived and nobody's to edit; the hand-painted ones are painted from the
 * sheet behind "Paint the map".
 *
 * THE WAY OUT IS AT THE FOOT OF THIS SCREEN, not inside Settings. Signing out
 * is not a setting — it is the last thing you do to yourself, and it was two
 * taps and a scroll down a screen of switches away from anywhere you would
 * look for it.
 *
 * TWO READS, NOT ONE. `me` is the identity every screen wants; `me.profile` is
 * the heavier face. Packing reads the first and has no use for a travel map.
 */
import { formatDateRange } from "@floc/core/dates/dates";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { IdentitySheet } from "@/components/auth/identity-sheet";
import { MapPromptCard } from "@/components/map/map-prompt";
import { MarkEditor } from "@/components/notes/mark-editor";
import { FaceSheet } from "@/components/auth/face-sheet";
import { ProfileFace, initialsOf } from "@/components/system/profile-face";
import { Sheet } from "@/components/system/sheet";
import { TravelMap } from "@/components/map/travel-map";
import { VerifyEmailCard } from "@/components/auth/verify-email";
import { ProRow } from "@/components/billing/pro-row";
import { Drawer, DrawerGroup, DrawerLink } from "@/components/system/drawer";
import {
  Body,
  Button,
  Card,
  Empty,
  Failed,
  Figure,
  Label,
  Loading,
  Row,
} from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { forgetThisPhone } from "@/lib/push/push";
import { space } from "@/lib/theme";

export default function Profile() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const me = useQuery(trpc.me.get.queryOptions());
  const billing = useQuery(trpc.billing.status.queryOptions());
  const face = useQuery(trpc.me.profile.queryOptions());
  const prompts = useQuery(trpc.me.mapPrompts.queryOptions());

  const [editing, setEditing] = useState(false);
  const [painting, setPainting] = useState(false);
  const [pickingFace, setPickingFace] = useState(false);

  /** Both reads move together: a mark changes the map and the two counts on the card. */
  const refetchFace = () => {
    queryClient.invalidateQueries({ queryKey: trpc.me.get.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.me.profile.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.me.mapPrompts.queryKey() });
  };

  const saveIdentity = useMutation({
    ...trpc.settings.identity.mutationOptions(),
    onSuccess: () => {
      setEditing(false);
      refetchFace();
    },
  });

  const saveFace = useMutation({
    ...trpc.settings.face.mutationOptions(),
    onSuccess: refetchFace,
  });

  const setMark = useMutation({
    ...trpc.me.setMark.mutationOptions(),
    onSuccess: refetchFace,
  });

  const answerPrompt = useMutation({
    ...trpc.me.answerMapPrompt.mutationOptions(),
    onSuccess: refetchFace,
  });

  if (me.isPending) return <Loading />;
  if (me.isError) return <Failed onRetry={() => me.refetch()} />;

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <ProfileFace
          name={me.data.name}
          avatarIcon={me.data.avatarIcon}
          been={me.data.been}
          wantToGo={me.data.wantToGo}
          vibeTags={face.data?.vibeTags ?? []}
          onEditName={() => setEditing(true)}
          onEditFace={() => setPickingFace(true)}
        />

        {/* Above the prompts and the map: it is the one thing on this screen
            that stops something else from working. It draws nothing at all
            once the address is confirmed. */}
        <VerifyEmailCard
          email={me.data.email}
          verified={me.data.emailVerified}
          canConfirm={me.data.canConfirmEmail}
        />

        {/* One card per trip you have left, above the rest: it is the
            only moment its countries can be kept. */}
        {prompts.data?.map((prompt) => (
          <MapPromptCard
            key={prompt.tripId}
            prompt={prompt}
            busy={answerPrompt.isPending}
            onAnswer={(keep) => answerPrompt.mutate({ tripId: prompt.tripId, keep })}
          />
        ))}

        {/* Up with the face, not at the foot: people are what you come to
            this screen for most, and a scroll past the map hid them. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friends"
          onPress={() => router.push("/friends")}
        >
          <Row>
            <Body bold>Friends</Body>
          </Row>
        </Pressable>

        <View style={{ gap: space.sm }}>
          <Label>Travel map</Label>
          <Card>
            {face.isPending ? (
              <Loading />
            ) : face.isError ? (
              <Failed onRetry={() => face.refetch()} />
            ) : (
              <TravelMap
                marks={face.data.map}
                editable
                onSet={(code, state) => setMark.mutate({ code, state })}
              />
            )}
          </Card>
          <Button label="Paint the map" variant="quiet" onPress={() => setPainting(true)} />
        </View>

        <YourTravel trips={face.data?.pastTrips} onKits={() => router.push("/kits")} />

        <View style={{ gap: space.sm }}>
          <View style={{ paddingHorizontal: space.xs }}>
            <Label>Account</Label>
          </View>
          <ProRow status={billing.data} onPress={() => router.push("/settings")} />
          <DrawerGroup>
            <DrawerLink first title="Settings" onPress={() => router.push("/settings")} />
          </DrawerGroup>
        </View>

        {/* Alone at the foot, because it ends the session rather than opening anything. */}
        <DrawerGroup>
          <DrawerLink
            first
            quiet
            title="Sign out of this phone"
            onPress={() => void forgetThisPhone().then(() => signOut()).then(() => router.replace("/"))}
          />
        </DrawerGroup>
      </ScrollView>

      {/* Keyed on the name it opened with, so re-opening after a save starts
          from the saved values rather than a stale draft. */}
      {editing ? (
        <IdentitySheet
          open
          key={me.data.name}
          name={me.data.name}
          busy={saveIdentity.isPending}
          error={saveIdentity.isError ? saveIdentity.error.message : null}
          onClose={() => setEditing(false)}
          onSave={(input) => saveIdentity.mutate(input)}
        />
      ) : null}

      <FaceSheet
        open={pickingFace}
        initials={initialsOf(me.data.name)}
        icon={me.data.avatarIcon}
        onClose={() => setPickingFace(false)}
        onPick={(avatarIcon) => saveFace.mutate({ avatarIcon })}
      />

      <Sheet open={painting} onClose={() => setPainting(false)}>
        <MarkEditor
          marks={face.data?.map ?? []}
          busy={setMark.isPending}
          onSet={(code, state) => setMark.mutate({ code, state })}
        />
      </Sheet>
    </>
  );
}

type PastTrip = { id: number; name: string; startDate: string | null; endDate: string | null };

function YourTravel({ trips, onKits }: { trips: PastTrip[] | undefined; onKits: () => void }) {
  return (
    <DrawerGroup label="Your travel">
      <Drawer first title="Past trips" summary={trips ? String(trips.length) : undefined}>
        {trips && trips.length === 0 ? <Empty>Nothing here yet.</Empty> : null}
        {trips?.map((trip) => (
          <View key={trip.id} style={{ gap: space.xs }}>
            <Body bold>{trip.name}</Body>
            <Figure tone="ink-3">{formatDateRange(trip.startDate, trip.endDate)}</Figure>
          </View>
        ))}
      </Drawer>
      {/* Saved lists are yours rather than any trip's, so they hang off you, not off a trip. */}
      <DrawerLink title="Saved packing lists" onPress={onKits} />
    </DrawerGroup>
  );
}
