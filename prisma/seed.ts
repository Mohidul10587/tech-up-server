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

    // `studentId` is intentionally omitted for the admin account — it is
    // student-only and generated in application code at registration time.
    await transaction.user.create({
      data: { phone, passwordHash, role: Role.ADMIN },
    });
  });

  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  console.log(`Seeded admin phone=${admin?.phone}.`);
}

main().finally(async () => prisma.$disconnect());
