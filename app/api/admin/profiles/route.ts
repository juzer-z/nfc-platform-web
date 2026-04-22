import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAccess, validateSameOrigin } from "@/lib/server-auth";

// ---------- helpers ----------
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pickNullableString(body: Record<string, unknown>, key: string): string | null {
  const v = body[key];
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function pickBoolean(body: Record<string, unknown>, key: string, fallback: boolean): boolean {
  return typeof body[key] === "boolean" ? (body[key] as boolean) : fallback;
}

async function slugExists(slug: string) {
  const found = await prisma.profile.findUnique({
    where: { slug },
    select: { id: true },
  });
  return !!found;
}

async function generateUniqueSlug(base: string) {
  const baseSlug = slugify(base) || "user";

  if (!(await slugExists(baseSlug))) return baseSlug;

  for (let i = 2; i < 5000; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!(await slugExists(candidate))) return candidate;
  }

  throw new Error("Could not generate unique slug");
}

// ---------- POST /api/admin/profiles ----------
export async function POST(req: Request) {
  try {
    const originError = validateSameOrigin(req);
    if (originError) return originError;

    const auth = await requireAdminApiAccess();
    if (auth.error) return auth.error;

    const body = (await req.json()) as Record<string, unknown>;

    const fullName = String(body.fullName ?? "").trim();
    if (!fullName) {
      return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
    }

    const requestedSlug = String(body.slug ?? "").trim();
    const slug = requestedSlug
      ? await generateUniqueSlug(requestedSlug)
      : await generateUniqueSlug(fullName);

    const created = await prisma.profile.create({
      data: {
        fullName,
        slug,

        title: pickNullableString(body, "title"),
        company: pickNullableString(body, "company"),
        department: pickNullableString(body, "department"),

        phone: pickNullableString(body, "phone"),
        whatsapp: pickNullableString(body, "whatsapp"),
        emailPublic: pickNullableString(body, "emailPublic"),
        website: pickNullableString(body, "website"),
        linkedin: pickNullableString(body, "linkedin"),

        address: pickNullableString(body, "address"),
        mapUrl: pickNullableString(body, "mapUrl"),

        photoUrl: pickNullableString(body, "photoUrl"),
        companyLogoUrl: (body.companyLogoUrl as string | null) ?? null,

        isActive: pickBoolean(body, "isActive", true),
        isPublished: pickBoolean(body, "isPublished", true),
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    // Race-condition friendly error if unique constraint triggers
    if (msg.includes("Unique constraint failed") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "Slug already exists. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
