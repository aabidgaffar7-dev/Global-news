// The crowd-ranking mechanic, told as a shape rather than a paragraph — a
// reader shouldn't have to read an essay to understand what makes this site
// different from every other aggregator.
const STEPS = [
  {
    n: "01",
    title: "Someone opens a story",
    body: "Every read is a vote. No account needed, nothing to click.",
    color: "#22d3ee",
  },
  {
    n: "02",
    title: "It climbs the ranking",
    body: "Attention moves it up. Recency fades, real readers take over.",
    color: "#a78bfa",
  },
  {
    n: "03",
    title: "Everyone sees what's actually read",
    body: "The front page reflects the crowd — not an editor, not engagement bait.",
    color: "#ec4899",
  },
];

export default function HowStoriesRise() {
  return (
    <section
      aria-labelledby="how-rise-heading"
      className="glass rounded-3xl p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="how-rise-heading"
          className="font-display text-xl font-medium text-[#ece8e1]"
        >
          Why these stories, in this order
        </h2>
        <p className="text-sm text-slate-500">
          No editor picks the front page. You do.
        </p>
      </div>

      <ol className="relative mt-6 grid gap-6 sm:grid-cols-3 sm:gap-4">
        {/* the through-line that makes it read as one flow, not three cards */}
        <div
          className="absolute left-0 right-0 top-4 hidden h-px sm:block"
          style={{
            background:
              "linear-gradient(90deg, #22d3ee55, #a78bfa55, #ec489955)",
          }}
          aria-hidden
        />
        {STEPS.map((s) => (
          <li key={s.n} className="relative">
            <div className="flex items-center gap-2.5">
              <span
                className="relative z-10 grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
                style={{
                  color: s.color,
                  background: `${s.color}1f`,
                  boxShadow: `0 0 0 1px ${s.color}55, 0 0 22px ${s.color}22`,
                }}
              >
                {s.n}
              </span>
              <span className="font-display text-[15px] font-medium leading-tight text-[#ece8e1]">
                {s.title}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:pl-[42px]">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
