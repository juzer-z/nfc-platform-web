import { prisma } from "@/lib/prisma";
import type { Profile } from "@prisma/client";
import { getProfileAnalytics } from "@/lib/analytics";
import { getAuthenticatedAdmin } from "@/lib/server-auth";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import ProfileForm from "../_components/profile-form";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) return notFound();

  const analytics = (await getProfileAnalytics([profile.id])).get(profile.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081021] via-[#0b1630] to-[#07101f] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="mt-2 text-white/60">Update details, upload images, or delete.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <AnalyticsCard label="Total Views" value={String(analytics?.totalViews ?? 0)} />
          <AnalyticsCard label="Views Last 7 Days" value={String(analytics?.viewsLast7Days ?? 0)} />
          <AnalyticsCard
            label="Last Viewed"
            value={analytics?.lastViewedAt ? formatDateTime(analytics.lastViewedAt) : "Never"}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.55)]">
          <ProfileForm mode="edit" initial={profile as Profile} />
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
      <div className="text-xs uppercase tracking-[0.24em] text-white/45">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
