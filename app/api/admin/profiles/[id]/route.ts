import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAccess, validateSameOrigin } from "@/lib/server-auth";

function hasOwn(obj: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(base: string, excludeId: string) {
  const baseSlug = slugify(base) || "user";

  // try baseSlug
  const first = await prisma.profile.findUnique({
    where: { slug: baseSlug },
    select: { id: true },
  });
  if (!first || first.id === excludeId) return baseSlug;

  // try baseSlug-2, baseSlug-3...
  for (let i = 2; i < 5000; i++) {
    const candidate = `${baseSlug}-${i}`;
    const hit = await prisma.profile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!hit || hit.id === excludeId) return candidate;
  }

  throw new Error("Could not generate unique slug");
}

function pickNullableString(
  body: Record<string, unknown>,
  key: string,
  existing: string | null
): string | null {
  if (!hasOwn(body, key)) return existing;
  const v = body[key];

  // allow explicit null
  if (v === null) return null;

  // allow empty string to clear
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function pickBoolean(
  body: Record<string, unknown>,
  key: string,
  existing: boolean
): boolean {
  if (!hasOwn(body, key)) return existing;
  return typeof body[key] === "boolean" ? (body[key] as boolean) : existing;
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;

    const auth = await requireAdminApiAccess();
    if (auth.error) return auth.error;

    const body = (await req.json()) as Record<string, unknown>;

    const existing = await prisma.profile.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Full name
    const incomingFullName = hasOwn(body, "fullName")
      ? String(body.fullName ?? "").trim()
      : existing.fullName;

    if (!incomingFullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    // Slug behavior:
    // - If user did NOT send slug field: keep existing.slug (stable URL)
    // - If user DID send slug field (even blank): regenerate from either provided slug or fullName
    let finalSlug = existing.slug;
    if (hasOwn(body, "slug")) {
      const rawSlug = String(body.slug ?? "").trim();
      const base = rawSlug ? rawSlug : incomingFullName;

      // OPTION A (recommended for admin UX): auto-generate unique always
      finalSlug = await generateUniqueSlug(base, id);

      // OPTION B (strict): if they typed a slug and it's taken, return 409
      // If you prefer strict mode, comment OPTION A line above and use this block:
      //
      // const normalized = slugify(base);
      // const hit = await prisma.profile.findUnique({ where: { slug: normalized }, select: { id: true } });
      // if (hit && hit.id !== id) {
      //   return NextResponse.json({ error: "Slug already exists. Choose another." }, { status: 409 });
      // }
      // finalSlug = normalized;
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: {
        slug: finalSlug,
        fullName: incomingFullName,

        title: pickNullableString(body, "title", existing.title),
        company: pickNullableString(body, "company", existing.company),
        department: pickNullableString(body, "department", existing.department),

        phone: pickNullableString(body, "phone", existing.phone),
        whatsapp: pickNullableString(body, "whatsapp", existing.whatsapp),
        emailPublic: pickNullableString(body, "emailPublic", existing.emailPublic),
        website: pickNullableString(body, "website", existing.website),
        linkedin: pickNullableString(body, "linkedin", existing.linkedin),

        address: pickNullableString(body, "address", existing.address),
        mapUrl: pickNullableString(body, "mapUrl", existing.mapUrl),
        photoUrl: pickNullableString(body, "photoUrl", existing.photoUrl),
        companyLogoUrl: pickNullableString(body, "companyLogoUrl", existing.companyLogoUrl),



        isActive: pickBoolean(body, "isActive", existing.isActive),
        isPublished: pickBoolean(body, "isPublished", existing.isPublished),
      },
    });

    return NextResponse.json({ ok: true, profile: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    // If DB unique constraint triggers (race condition), still return a friendly error
    if (msg.includes("Unique constraint failed") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists. Choose another." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;

    const auth = await requireAdminApiAccess();
    if (auth.error) return auth.error;

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.profile.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
