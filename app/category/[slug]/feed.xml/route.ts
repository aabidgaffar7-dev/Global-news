import { getAllStories, storiesInCategory } from "@/lib/news";
import { buildRss, SITE_BASE, BRAND_NAME } from "@/lib/rss";
import {
  CATEGORY_META,
  DISPLAY_CATEGORIES,
  type Category,
} from "@/lib/categories";

export const revalidate = 600;

const VALID = new Set<Category>([...DISPLAY_CATEGORIES, "world"]);

export function generateStaticParams() {
  return [...VALID].map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!VALID.has(slug as Category))
    return new Response("Not found", { status: 404 });
  const category = slug as Category;
  const meta = CATEGORY_META[category];
  const stories = storiesInCategory(await getAllStories(), category).slice(0, 30);
  return buildRss({
    title: `${BRAND_NAME} ${meta.label} news`,
    link: `${SITE_BASE}/category/${category}`,
    description: meta.description,
    stories,
  });
}
