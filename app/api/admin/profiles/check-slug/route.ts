import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAccess } from "@/lib/server-auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: Request) {
  const auth = await requireAdminApiAccess();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const raw = url.searchParams.get("slug") ?? "";
  const slug = slugify(raw);

  if (!slug) {
    return NextResponse.json({ ok: true, slug: "", available: false });
  }

  const hit = await prisma.profile.findUnique({
    where: { slug },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, slug, available: !hit });
}
