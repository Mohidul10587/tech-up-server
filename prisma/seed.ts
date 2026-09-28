import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!phone || !password) {
    throw new Error('ADMIN_PHONE and ADMIN_PASSWORD must be set before seeding.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { phone },
    update: { passwordHash, role: Role.ADMIN },
    create: { phone, passwordHash, role: Role.ADMIN },
  });
}

main()
  .finally(async () => prisma.$disconnect());
