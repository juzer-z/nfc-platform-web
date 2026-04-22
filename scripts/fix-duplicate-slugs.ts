import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  const profiles = await prisma.profile.findMany({
    select: { id: true, slug: true, fullName: true },
    orderBy: { slug: "asc" },
  });

  const groups = new Map<string, { id: string; fullName: string }[]>();

  for (const p of profiles) {
    const s = (p.slug || slugify(p.fullName) || "user").trim();
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push({ id: p.id, fullName: p.fullName });
  }

  for (const [slug, list] of groups.entries()) {
    if (list.length <= 1) continue;

    // keep first, rename the rest
    for (let i = 1; i < list.length; i++) {
      let n = 2;
      while (true) {
        const candidate = `${slug}-${n}`;
        const exists = await prisma.profile.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });
        if (!exists) {
          await prisma.profile.update({
            where: { id: list[i].id },
            data: { slug: candidate },
          });
          console.log(`Updated ${list[i].id}: ${slug} -> ${candidate}`);
          break;
        }
        n++;
      }
    }
  }

  console.log("Duplicate slug cleanup done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
