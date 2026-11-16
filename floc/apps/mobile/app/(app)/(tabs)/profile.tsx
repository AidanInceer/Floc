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

        <VerifyEmailCard
          email={me.data.email}
          verified={me.data.emailVerified}
          canConfirm={me.data.canConfirmEmail}
        />

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

        <DrawerGroup>
          <DrawerLink
            first
            quiet
            title="Sign out of this phone"
            onPress={() => void forgetThisPhone().then(() => signOutHere()).then(() => router.replace("/"))}
          />
        </DrawerGroup>
      </ScrollView>

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
      <DrawerLink first title="Lists" onPress={onLists} />
    </DrawerGroup>
  );
}
