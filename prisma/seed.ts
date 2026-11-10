import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { name: "Alice Reader" },
    create: {
      email: "alice@example.com",
      name: "Alice Reader",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { name: "Bob Bookworm" },
    create: {
      email: "bob@example.com",
      name: "Bob Bookworm",
    },
  });

  const club = await prisma.club.upsert({
    where: { slug: "tuesday-readers" },
    update: {},
    create: {
      name: "Tuesday Night Readers",
      slug: "tuesday-readers",
      description: "A cozy fiction book club that meets every other Tuesday.",
      ownerId: alice.id,
      memberships: {
        create: [
          { userId: alice.id, role: "OWNER", status: "ACTIVE" },
          { userId: bob.id, role: "MEMBER", status: "ACTIVE" },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log(`  Club: ${club.name} (/clubs/${club.slug})`);
  console.log("  Users: alice@example.com, bob@example.com");
  console.log("  Sign in by requesting a magic link for one of those addresses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
