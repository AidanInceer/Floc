/**
 * Nothing renders here — the root layout decides where a cold start lands, and
 * it needs a route to redirect *from*.
 */
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/sign-in" />;
}
