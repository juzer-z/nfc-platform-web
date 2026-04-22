import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { recordProfileView } from "@/lib/analytics";
import ProfileCard from "./profile-card";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.profile.findUnique({ where: { slug } });
  if (!profile || !profile.isActive || !profile.isPublished) return notFound();

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");

  await recordProfileView({
    profileId: profile.id,
    ipAddress,
    userAgent: requestHeaders.get("user-agent"),
    referer: requestHeaders.get("referer"),
  });

  return <ProfileCard slug={slug} profile={profile} />;
}
