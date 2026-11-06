export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ status: "ok", sha: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.FLOC_COMMIT_SHA ?? null },
    { headers: { "Cache-Control": "no-store" } });
}
