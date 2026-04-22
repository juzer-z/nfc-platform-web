import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getProfileAnalytics } from "@/lib/analytics";
import { getAuthenticatedAdmin } from "@/lib/server-auth";
import { redirect } from "next/navigation";

type ProfilesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ProfilesPage({
  searchParams,
}: ProfilesPageProps) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const { q = "" } = await searchParams;
  const query = q.trim();

  const profiles = await prisma.profile.findMany({
    where: query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { department: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { whatsapp: { contains: query, mode: "insensitive" } },
            { emailPublic: { contains: query, mode: "insensitive" } },
            { website: { contains: query, mode: "insensitive" } },
            { linkedin: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  const analyticsByProfileId = await getProfileAnalytics(profiles.map((profile) => profile.id));

  return (
    <div className="min-h-screen bg-gray-900 p-10 text-white">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Profiles</h1>
          <p className="mt-2 text-sm text-gray-400">
            Search by name, phone, WhatsApp, company, email, slug, and more.
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">
            Signed in as {admin.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/profiles/new"
            className="rounded bg-blue-600 px-5 py-2 font-semibold hover:bg-blue-500"
          >
            + New Profile
          </Link>
          <a
            href="/api/auth/logout"
            className="rounded border border-gray-700 bg-gray-800 px-5 py-2 font-semibold text-gray-200 hover:bg-gray-700"
          >
            Logout
          </a>
        </div>
      </div>

      <form className="mb-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, number, company, email, slug..."
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
            >
              Search
            </button>
            {query && (
              <Link
                href="/admin/profiles"
                className="rounded border border-gray-700 bg-gray-800 px-5 py-3 font-semibold text-gray-200 hover:bg-gray-700"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg bg-gray-800">
        <table className="w-full">
          <thead className="bg-gray-700 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Views</th>
              <th className="p-3">Last Seen</th>
              <th className="p-3">Active</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const analytics = analyticsByProfileId.get(p.id);

              return (
                <tr key={p.id} className="border-t border-gray-700">
                  <td className="p-3">{p.fullName}</td>
                  <td className="p-3 text-gray-300">/u/{p.slug}</td>
                  <td className="p-3">
                    <div className="font-semibold text-white">
                      {analytics?.totalViews ?? 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      7d: {analytics?.viewsLast7Days ?? 0}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-300">
                    {analytics?.lastViewedAt
                      ? formatDateTime(analytics.lastViewedAt)
                      : "Never"}
                  </td>
                  <td className="p-3">{p.isActive ? "Yes" : "No"}</td>
                  <td className="p-3">{p.isPublished ? "Yes" : "No"}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/profiles/${p.id}`}
                      className="text-blue-300 underline hover:text-blue-200"
                    >
                      Edit
                    </Link>
                    <span className="mx-2 text-gray-500">|</span>
                    <Link
                      href={`/u/${p.slug}`}
                      className="text-green-300 underline hover:text-green-200"
                      target="_blank"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}

            {profiles.length === 0 && (
              <tr>
                <td className="p-6 text-gray-300" colSpan={7}>
                  {query
                    ? `No profiles found for "${query}".`
                    : "No profiles yet. Click \"New Profile\"."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3 text-center">
        <a
          href="https://1card.fyi"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center transition hover:opacity-80"
          aria-label="Visit 1card.fyi"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/1card-fyi-logo-white.svg"
            alt="1card.fyi"
            className="h-8 w-auto opacity-50"
          />
        </a>
        <div className="text-xs text-white/30">
          Powered by{" "}
          <a
            href="https://3jtec.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 transition hover:text-white/50"
          >
            3J Technologies
          </a>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
