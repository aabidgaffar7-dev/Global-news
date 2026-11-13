import { getAllStories } from "@/lib/news";
import { buildRss, SITE_BASE, BRAND_NAME } from "@/lib/rss";

export const revalidate = 600;

export async function GET() {
  const stories = (await getAllStories()).slice(0, 30);
  return buildRss({
    title: `${BRAND_NAME} top stories`,
    link: SITE_BASE,
    description: "World news ranked by readers, not editors.",
    stories,
  });
}
