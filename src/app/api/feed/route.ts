import { getSafetyFeed } from "@/lib/feed";

export const revalidate = 900;

export async function GET() {
  const feed = await getSafetyFeed();
  return Response.json(feed, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
}
