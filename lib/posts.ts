import { getServerSupabase, getUser } from "./supabase-server";

export type PostSummary = {
  id: string;
  title: string;
  body: string | null;
  topic: string | null;
  author: string;
  createdAt: string;
  score: number;
  myVote: number;
  commentCount: number;
};

export type PostSort = "hot" | "new" | "top";

// A post's discussion lives in the shared `comments` table under this key, so
// posts and articles reuse the exact same threading + comment voting.
export const postLink = (id: string) => `post:${id}`;

function hotness(score: number, createdAt: string): number {
  const ageH = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  // Reddit-ish: score decays with age so fresh conversation surfaces.
  return (score + 1) / Math.pow(ageH + 2, 1.3);
}

export async function listPosts(
  sort: PostSort = "hot",
  limit = 50,
): Promise<{ posts: PostSummary[]; userId: string | null }> {
  try {
    const sb = await getServerSupabase();
    const user = await getUser();
    const uid = user?.id ?? null;

    const { data: rows } = await sb
      .from("posts")
      .select("id,user_id,title,body,topic,created_at")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    const posts = rows ?? [];
    if (posts.length === 0) return { posts: [], userId: uid };

    const ids = posts.map((p) => p.id as string);
    const [votesRes, profRes, commentsRes] = await Promise.all([
      sb.from("post_votes").select("post_id,user_id,value").in("post_id", ids),
      sb
        .from("profiles")
        .select("id,display_name")
        .in("id", [...new Set(posts.map((p) => p.user_id as string))]),
      sb
        .from("comments")
        .select("link")
        .in("link", ids.map(postLink)),
    ]);

    const names = new Map(
      (profRes.data ?? []).map((p) => [
        p.id as string,
        (p.display_name as string) || "Reader",
      ]),
    );
    const score = new Map<string, number>();
    const mine = new Map<string, number>();
    for (const v of votesRes.data ?? []) {
      const pid = v.post_id as string;
      score.set(pid, (score.get(pid) ?? 0) + ((v.value as number) ?? 0));
      if (uid && v.user_id === uid) mine.set(pid, (v.value as number) ?? 0);
    }
    const comments = new Map<string, number>();
    for (const c of commentsRes.data ?? []) {
      const key = (c.link as string).replace(/^post:/, "");
      comments.set(key, (comments.get(key) ?? 0) + 1);
    }

    const mapped: PostSummary[] = posts.map((p) => ({
      id: p.id as string,
      title: p.title as string,
      body: (p.body as string) ?? null,
      topic: (p.topic as string) ?? null,
      author: names.get(p.user_id as string) ?? "Reader",
      createdAt: p.created_at as string,
      score: score.get(p.id as string) ?? 0,
      myVote: mine.get(p.id as string) ?? 0,
      commentCount: comments.get(p.id as string) ?? 0,
    }));

    if (sort === "top") mapped.sort((a, b) => b.score - a.score);
    else if (sort === "hot")
      mapped.sort(
        (a, b) =>
          hotness(b.score, b.createdAt) - hotness(a.score, a.createdAt),
      );
    // "new" is already chronological from the query.

    return { posts: mapped, userId: uid };
  } catch {
    return { posts: [], userId: null };
  }
}

export async function getPost(id: string): Promise<PostSummary | null> {
  try {
    const sb = await getServerSupabase();
    const user = await getUser();
    const uid = user?.id ?? null;

    const { data: p } = await sb
      .from("posts")
      .select("id,user_id,title,body,topic,created_at,deleted")
      .eq("id", id)
      .maybeSingle();
    if (!p || p.deleted) return null;

    const [votesRes, profRes] = await Promise.all([
      sb.from("post_votes").select("user_id,value").eq("post_id", id),
      sb
        .from("profiles")
        .select("display_name")
        .eq("id", p.user_id as string)
        .maybeSingle(),
    ]);
    const votes = votesRes.data ?? [];
    return {
      id: p.id as string,
      title: p.title as string,
      body: (p.body as string) ?? null,
      topic: (p.topic as string) ?? null,
      author: (profRes.data?.display_name as string) || "Reader",
      createdAt: p.created_at as string,
      score: votes.reduce((n, v) => n + ((v.value as number) ?? 0), 0),
      myVote: (uid && votes.find((v) => v.user_id === uid)?.value) || 0,
      commentCount: 0,
    };
  } catch {
    return null;
  }
}
