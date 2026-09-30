import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.ADMIN_PHONE ?? '01700000000';
  const password = process.env.ADMIN_PASSWORD ?? phone;

  if (!phone || !password) {
    throw new Error(
      'ADMIN_PHONE and ADMIN_PASSWORD must be set before seeding.',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (transaction) => {
    // Full reseed: every user of every role is removed, not only the previous
    // administrator. This is a destructive, intentional reset of local/dev data.
    await transaction.user.deleteMany({});

    // The table is now empty, so rewind the one global user-ID sequence back to
    // its origin. The reseeded admin is then allocated `001` by the same
    // database default every future user uses - there is no separate admin
    // sequence, and the column is still filled by the database, never by hand.
    // Guarded by `to_regclass` so seeding still works before the migration that
    // introduces the sequence has been applied.
    await transaction.$executeRawUnsafe(`
      SELECT setval(
        '"User_customUserId_seq"',
        1,
        FALSE
      )
      WHERE to_regclass('"User_customUserId_seq"') IS NOT NULL
    `);

    // `customUserId` is intentionally omitted so PostgreSQL allocates the next
    // value from the one global sequence.
    await transaction.user.create({
      data: { phone, passwordHash, role: Role.ADMIN },
    });
  });

  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  console.log(
    `Seeded admin customUserId=${admin?.customUserId} phone=${phone}.`,
  );
}

main().finally(async () => prisma.$disconnect());
