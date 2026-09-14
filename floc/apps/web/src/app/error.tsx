"use client";

/**
 * The error boundary for every route below it (ticket 202). It says what
 * happened and offers the two things that actually help — retry the render,
 * or leave — and it apologises for nothing.
 *
 * `digest` is the only detail shown: Next.js strips server error messages in
 * production, and the digest is the handle that ties this screen to the server
 * log. The message itself is never printed — it can carry anything the query
 * was holding.
 */
import { ButtonLink, Button, PageTitle } from "@/components/system/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 pb-20 pt-16 text-center sm:px-6">
      <p className="typed">Something went wrong</p>
      <PageTitle className="mt-3">
        This page didn&rsquo;t load
      </PageTitle>
      <p className="mx-auto mt-4 max-w-[48ch] text-sm text-ink-soft">
        Nothing you did caused it and nothing you had saved is lost. Try it
        again — if it keeps happening, the reference below identifies it.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink variant="secondary" href="/trips">
          Your trips
        </ButtonLink>
      </div>
      {error.digest ? (
        <p className="nums mt-6 text-xs text-ink-faint">
          Reference {error.digest}
        </p>
      ) : null}
    </div>
  );
}
