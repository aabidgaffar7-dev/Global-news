import { getServerSupabase, getUser } from "./supabase-server";
import { normalizeUrl } from "./url";

export type CommentNode = {
  id: string;
  body: string;
  author: string;
  authorId: string;
  createdAt: string;
  score: number;
  myVote: number;
  deleted: boolean;
  replies: CommentNode[];
};

export type ArticleCommunity = {
  score: number;
  myVote: number;
  comments: CommentNode[];
  commentCount: number;
  userId: string | null;
};

// Everything here is best-effort: the community tables may not exist yet, and
// a discussion failure must never take down an article page.
export async function getArticleCommunity(
  link: string,
): Promise<ArticleCommunity> {
  const key = normalizeUrl(link);
  const empty: ArticleCommunity = {
    score: 0,
    myVote: 0,
    comments: [],
    commentCount: 0,
    userId: null,
  };
  try {
    const sb = await getServerSupabase();
    const user = await getUser();
    const uid = user?.id ?? null;

    const [votesRes, commentsRes] = await Promise.all([
      sb.from("article_votes").select("user_id,value").eq("link", key),
      sb
        .from("comments")
        .select("id,user_id,parent_id,body,created_at,deleted")
        .eq("link", key)
        .order("created_at", { ascending: true })
        .limit(400),
    ]);

    const votes = votesRes.data ?? [];
    const score = votes.reduce((n, v) => n + ((v.value as number) ?? 0), 0);
    const myVote =
      (uid && votes.find((v) => v.user_id === uid)?.value) || 0;

    const rows = commentsRes.data ?? [];
    if (rows.length === 0)
      return { score, myVote: myVote as number, comments: [], commentCount: 0, userId: uid };

    const ids = rows.map((r) => r.id as string);
    const authorIds = [...new Set(rows.map((r) => r.user_id as string))];
    const [cvRes, profRes] = await Promise.all([
      sb.from("comment_votes").select("comment_id,user_id,value").in("comment_id", ids),
      sb.from("profiles").select("id,display_name").in("id", authorIds),
    ]);

    const names = new Map(
      (profRes.data ?? []).map((p) => [p.id as string, (p.display_name as string) || "Reader"]),
    );
    const scores = new Map<string, number>();
    const mine = new Map<string, number>();
    for (const v of cvRes.data ?? []) {
      const cid = v.comment_id as string;
      scores.set(cid, (scores.get(cid) ?? 0) + ((v.value as number) ?? 0));
      if (uid && v.user_id === uid) mine.set(cid, (v.value as number) ?? 0);
    }

    const byId = new Map<string, CommentNode>();
    for (const r of rows) {
      const id = r.id as string;
      byId.set(id, {
        id,
        body: (r.deleted as boolean) ? "[removed]" : (r.body as string),
        author: names.get(r.user_id as string) ?? "Reader",
        authorId: r.user_id as string,
        createdAt: r.created_at as string,
        score: scores.get(id) ?? 0,
        myVote: mine.get(id) ?? 0,
        deleted: (r.deleted as boolean) ?? false,
        replies: [],
      });
    }

    const roots: CommentNode[] = [];
    for (const r of rows) {
      const node = byId.get(r.id as string)!;
      const parent = r.parent_id ? byId.get(r.parent_id as string) : null;
      if (parent) parent.replies.push(node);
      else roots.push(node);
    }
    // Top-level sorted by score (Reddit-ish); replies stay chronological.
    roots.sort((a, b) => b.score - a.score || (a.createdAt < b.createdAt ? 1 : -1));

    return {
      score,
      myVote: myVote as number,
      comments: roots,
      commentCount: rows.length,
      userId: uid,
    };
  } catch {
    return empty;
  }
}

export type Poll = {
  id: string;
  question: string;
  options: string[];
  counts: number[];
  total: number;
  myVote: number | null;
};

export async function getPolls(limit = 10): Promise<{ polls: Poll[]; userId: string | null }> {
  try {
    const sb = await getServerSupabase();
    const user = await getUser();
    const uid = user?.id ?? null;

    const { data: pollRows } = await sb
      .from("polls")
      .select("id,question,options,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    const rows = pollRows ?? [];
    if (rows.length === 0) return { polls: [], userId: uid };

    const ids = rows.map((p) => p.id as string);
    const { data: voteRows } = await sb
      .from("poll_votes")
      .select("poll_id,user_id,option_index")
      .in("poll_id", ids);

    const polls: Poll[] = rows.map((p) => {
      const options = (p.options as string[]) ?? [];
      const counts = new Array(options.length).fill(0) as number[];
      let myVote: number | null = null;
      for (const v of voteRows ?? []) {
        if (v.poll_id !== p.id) continue;
        const idx = v.option_index as number;
        if (idx >= 0 && idx < counts.length) counts[idx]++;
        if (uid && v.user_id === uid) myVote = idx;
      }
      return {
        id: p.id as string,
        question: p.question as string,
        options,
        counts,
        total: counts.reduce((a, b) => a + b, 0),
        myVote,
      };
    });
    return { polls, userId: uid };
  } catch {
    return { polls: [], userId: null };
  }
}
