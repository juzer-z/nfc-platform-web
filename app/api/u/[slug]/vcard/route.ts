import { prisma } from "@/lib/prisma";

function esc(s: string) {
  return s.replace(/\n/g, "\\n");
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
  const email = p.emailPublic || "";
  const website = p.website || "";
  const linkedin = p.linkedin || "";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(fullName)}`,
    org ? `ORG:${esc(org)}` : "",
    title ? `TITLE:${esc(title)}` : "",
    phone ? `TEL;TYPE=CELL:${esc(phone)}` : "",
    email ? `EMAIL;TYPE=INTERNET:${esc(email)}` : "",
    website ? `URL:${esc(website.startsWith("http") ? website : "https://" + website)}` : "",
    linkedin ? `X-SOCIALPROFILE;type=linkedin:${esc(linkedin.startsWith("http") ? linkedin : "https://" + linkedin)}` : "",
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
