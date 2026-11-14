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
 * card, in one sheet that saves both, not by a button parked under it — the same move the trip header makes,
 * for the same reason: a rename is rare, and a permanent form for a rare job
 * is furniture.
 *
 * THE COUNTS ARE DERIVED (#95). Been and want-to-go come off the trips you are
 * on, read fresh, never stored — so this can never disagree with the web.
 *
 * THE WAY OUT IS AT THE FOOT OF THIS SCREEN, not inside Settings. Signing out
 * is not a setting — it is the last thing you do to yourself, and it was two
 * taps and a scroll down a screen of switches away from anywhere you would
 * look for it.
 *
 * TWO READS, NOT ONE. `me` is the identity every screen wants; `me.profile` is
 * the heavier face. Packing reads the first and has no use for vibe tags.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { FaceSheet } from "@/components/auth/face-sheet";
import { ProfileFace } from "@/components/system/profile-face";
import { VerifyEmailCard } from "@/components/auth/verify-email";
import { ProRow } from "@/components/billing/pro-row";
import { DrawerGroup, DrawerLink } from "@/components/system/drawer";
import { Body, Failed, Loading, Row, SectionTitle } from "@/components/system/ui";
import { trpc } from "@/lib/api";
import { signOutHere } from "@/lib/sign-out";
import { forgetThisPhone } from "@/lib/push/push";
import { space } from "@/lib/theme";

export default function Profile() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const me = useQuery(trpc.me.get.queryOptions());
  const billing = useQuery(trpc.billing.status.queryOptions());
  const waitingBookings = useQuery(trpc.bookings.waitingCount.queryOptions()).data ?? 0;
  const face = useQuery(trpc.me.profile.queryOptions());

  const [editing, setEditing] = useState(false);

  const refetchFace = () => {
    queryClient.invalidateQueries({ queryKey: trpc.me.get.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.me.profile.queryKey() });
  };

  const saveIdentity = useMutation(trpc.settings.identity.mutationOptions());
  const saveAll = useMutation({
    mutationFn: (input: { displayName: string }) => saveIdentity.mutateAsync(input),
    onSuccess: () => {
      setEditing(false);
      refetchFace();
    },
  });

  if (me.isPending) return <Loading />;
  if (me.isError) return <Failed onRetry={() => me.refetch()} />;

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <ProfileFace
          name={me.data.name}
          been={me.data.been}
          wantToGo={me.data.wantToGo}
          vibeTags={face.data?.vibeTags ?? []}
          onEdit={() => setEditing(true)}
        />

        {/* Under the face: it is the one thing on this screen
            that stops something else from working. It draws nothing at all
            once the address is confirmed. */}
        <VerifyEmailCard
          email={me.data.email}
          verified={me.data.emailVerified}
          canConfirm={me.data.canConfirmEmail}
        />

        {/* Up with the face, not at the foot: people are what you come to this screen for most. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friends"
          onPress={() => router.push("/friends")}
        >
          <Row>
            <Body bold>Friends</Body>
          </Row>
        </Pressable>

        <YourTravel onLists={() => router.push("/lists")} />

        <View style={{ gap: space.sm }}>
          <View style={{ paddingHorizontal: space.xs }}>
            <SectionTitle>Account</SectionTitle>
          </View>
          <ProRow status={billing.data} onPress={() => router.push("/settings")} />
          <DrawerGroup>
            <DrawerLink first title="Settings" onPress={() => router.push("/settings")} />
            <DrawerLink
              title="Bookings"
              summary={waitingBookings ? `${waitingBookings} waiting for a trip` : undefined}
              onPress={() => router.push("/bookings" as Href)}
            />
          </DrawerGroup>
        </View>

        {/* Alone at the foot, because it ends the session rather than opening anything. */}
        <DrawerGroup>
          <DrawerLink
            first
            quiet
            title="Sign out of this phone"
            onPress={() => void forgetThisPhone().then(() => signOutHere()).then(() => router.replace("/"))}
          />
        </DrawerGroup>
      </ScrollView>

      {/* Mounted only while open, so re-opening after a save starts from the saved values. */}
      {editing ? (
        <FaceSheet
          name={me.data.name}
          busy={saveAll.isPending}
          error={saveAll.isError ? saveAll.error.message : null}
          onClose={() => setEditing(false)}
          onSave={(input) => saveAll.mutate(input)}
        />
      ) : null}
    </>
  );
}

function YourTravel({ onLists }: { onLists: () => void }) {
  return (
    <DrawerGroup>
      {/* Lists are yours rather than any trip's, so they hang off you, not off a trip (#467). */}
      <DrawerLink first title="Lists" onPress={onLists} />
    </DrawerGroup>
  );
}
