import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import WelcomePicker from "@/components/WelcomePicker";
import { getUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen text-slate-200">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
          Welcome to GlobeNews
        </div>
        <h1 className="font-display mt-3 text-3xl font-medium text-[#ece8e1] sm:text-4xl">
          Build your <span className="aurora-text italic">newsroom</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm text-slate-400">
          Thirty seconds of setup makes everything personal: your For You feed,
          your wire, and your notification bell all follow what you pick.
        </p>
        <div className="mt-8">
          <WelcomePicker userId={user.id} />
        </div>
      </main>
    </div>
  );
}
