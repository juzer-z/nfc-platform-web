import { prisma } from "@/lib/prisma";

function esc(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function normalizeUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;

  const p = await prisma.profile.findUnique({ where: { slug } });

  if (!p || !p.isActive || !p.isPublished) {
    return new Response("Not found", { status: 404 });
  }

  const fullName = p.fullName || "";
  const org = p.company || "";
  const title = p.title || "";
  const phone = p.phone || "";
  const whatsapp = p.whatsapp || "";
  const email = p.emailPublic || "";
  const website = p.website || "";
  const linkedin = p.linkedin || "";
  const address = p.address || "";
  const photoUrl = p.photoUrl || "";
  const { firstName, lastName } = splitName(fullName);

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(lastName)};${esc(firstName)};;;`,
    `FN:${esc(fullName)}`,
    org ? `ORG:${esc(org)}` : "",
    title ? `TITLE:${esc(title)}` : "",
    phone ? `TEL;TYPE=CELL:${esc(phone)}` : "",
    whatsapp ? `TEL;TYPE=CELL,VOICE:${esc(whatsapp)}` : "",
    email ? `EMAIL;TYPE=INTERNET:${esc(email)}` : "",
    website ? `URL:${esc(normalizeUrl(website))}` : "",
    linkedin ? `X-SOCIALPROFILE;type=linkedin:${esc(normalizeUrl(linkedin))}` : "",
    address ? `ADR;TYPE=WORK:;;${esc(address)};;;;` : "",
    photoUrl ? `PHOTO;VALUE=URI:${esc(normalizeUrl(photoUrl))}` : "",
    "END:VCARD",
  ].filter(Boolean);

  const vcf = lines.join("\r\n");

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
