import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProfileAnalyticsSummary = {
  profileId: string;
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  lastViewedAt: Date | null;
};

type ProfileAnalyticsRow = {
  profileId: string;
  totalViews: bigint;
  viewsLast7Days: bigint;
  viewsLast30Days: bigint;
  lastViewedAt: Date | null;
};

export async function recordProfileView(input: {
  profileId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}) {
  await prisma.$executeRaw`
    INSERT INTO "ProfileView" ("id", "profileId", "ipAddress", "userAgent", "referer", "viewedAt")
    VALUES (
      ${crypto.randomUUID()},
      ${input.profileId},
      ${truncate(input.ipAddress, 128)},
      ${truncate(input.userAgent, 512)},
      ${truncate(input.referer, 512)},
      NOW()
    )
  `;
}

export async function getProfileAnalytics(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, ProfileAnalyticsSummary>();
  }

  const rows = await prisma.$queryRaw<ProfileAnalyticsRow[]>(Prisma.sql`
    SELECT
      pv."profileId" AS "profileId",
      COUNT(*)::bigint AS "totalViews",
      COUNT(*) FILTER (WHERE pv."viewedAt" >= NOW() - INTERVAL '7 days')::bigint AS "viewsLast7Days",
      COUNT(*) FILTER (WHERE pv."viewedAt" >= NOW() - INTERVAL '30 days')::bigint AS "viewsLast30Days",
      MAX(pv."viewedAt") AS "lastViewedAt"
    FROM "ProfileView" pv
    WHERE pv."profileId" IN (${Prisma.join(profileIds)})
    GROUP BY pv."profileId"
  `);

  const analyticsByProfileId = new Map<string, ProfileAnalyticsSummary>();

  for (const row of rows) {
    analyticsByProfileId.set(row.profileId, {
      profileId: row.profileId,
      totalViews: Number(row.totalViews),
      viewsLast7Days: Number(row.viewsLast7Days),
      viewsLast30Days: Number(row.viewsLast30Days),
      lastViewedAt: row.lastViewedAt,
    });
  }

  return analyticsByProfileId;
}

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  return value.slice(0, maxLength);
}
