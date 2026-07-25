import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hashPassword("password123");

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: { passwordHash },
    create: {
      email: "alice@example.com",
      username: "alice",
      name: "Alice Reader",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { passwordHash },
    create: {
      email: "bob@example.com",
      username: "bob",
      name: "Bob Bookworm",
      passwordHash,
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
  console.log("  Users: alice@example.com, bob@example.com (password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
