import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { extract } from "@extractus/article-extractor";
import { getAllStories, type Story } from "./news";

// Default model per Anthropic guidance. NOTE: this runs once per article on first
// view. For high volume, "claude-haiku-4-5" is ~5x cheaper input / ~5x output.
// Change this one constant to trade cost vs. quality.
const MODEL = "claude-opus-4-8";

export type ArticleSummary = { summary: string; keyPoints: string[] };

export type SummaryResult =
  | { status: "ok"; summary: ArticleSummary }
  | { status: "no-api-key" }
  | { status: "no-content" }
  | { status: "error" };

export async function getStoryById(id: string): Promise<Story | undefined> {
  const stories = await getAllStories();
  return stories.find((s) => s.id === id);
}

// Web (GNews) results carry their data packed into the id, so the article page
// can summarize them without a server-side store. See encodeWebId in lib/gnews.ts.
export function decodeWebStory(id: string): Story | undefined {
  if (!id.startsWith("web_")) return undefined;
  try {
    const p = JSON.parse(
      Buffer.from(id.slice(4), "base64url").toString("utf8"),
    );
    if (!p.u || !p.t) return undefined;
    return {
      id,
      title: p.t,
      link: p.u,
      source: p.s ?? "Web",
      sourceId: "gnews",
      lean: "intl",
      category: p.c ?? "world",
      summary: p.d,
      imageUrl: p.i,
      publishedAt: p.p ?? new Date().toISOString(),
      lat: 0,
      lng: 0,
      city: "",
      country: "",
      score: 0,
    } as Story;
  } catch {
    return undefined;
  }
}

// Resolve an article id to a story — RSS (cached set) or a web result (encoded id).
export async function resolveStory(id: string): Promise<Story | undefined> {
  return (await getStoryById(id)) ?? decodeWebStory(id);
}

const SummarySchema = z.object({
  summary: z
    .string()
    .describe("A neutral, factual 2-3 paragraph summary of the article."),
  keyPoints: z
    .array(z.string())
    .describe("3 to 5 short, factual takeaways from the article."),
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchArticleText(url: string): Promise<string | null> {
  try {
    const article = await extract(
      url,
      {},
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; GlobeNewsBot/0.1; +https://globe-news.local)",
        },
      },
    );
    const content = article?.content ? stripHtml(article.content) : "";
    if (content.length < 200) return null; // too little to summarize meaningfully
    return content.slice(0, 12000); // bound input tokens / cost
  } catch {
    return null;
  }
}

// Summaries are stable per article, so cache by story id — we pay the model once.
const cache = new Map<string, ArticleSummary>();

export async function summarizeStory(story: Story): Promise<SummaryResult> {
  const cached = cache.get(story.id);
  if (cached) return { status: "ok", summary: cached };

  // grep process.env.ANTHROPIC_API_KEY — never read .env directly.
  if (!process.env.ANTHROPIC_API_KEY) return { status: "no-api-key" };

  const text = await fetchArticleText(story.link);
  if (!text) return { status: "no-content" };

  try {
    const client = new Anthropic();
    const message = await client.messages.parse({
      model: MODEL,
      max_tokens: 1500,
      system:
        "You are a neutral news summarizer for an unbiased news hub. Summarize the " +
        "article factually and impartially in 2-3 short paragraphs. Strip out " +
        "editorializing, loaded language, speculation, and opinion — report only " +
        "what the article states. Then give 3-5 concise factual takeaways. Do not " +
        "add information that is not in the article.",
      messages: [
        {
          role: "user",
          content: `Source: ${story.source}\nHeadline: ${story.title}\n\nArticle:\n${text}`,
        },
      ],
      output_config: { format: zodOutputFormat(SummarySchema) },
    });

    const parsed = message.parsed_output;
    if (!parsed) return { status: "error" };
    cache.set(story.id, parsed);
    return { status: "ok", summary: parsed };
  } catch {
    return { status: "error" };
  }
}
