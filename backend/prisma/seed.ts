import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadm@adm.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadm@adm.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log('Seed completed:', superAdmin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
