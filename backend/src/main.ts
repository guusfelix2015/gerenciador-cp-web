import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  const prisma = new PrismaClient();
  try {
    const existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'superadm@adm.com',
          passwordHash,
          role: UserRole.SUPER_ADMIN,
        },
      });
      console.log('Seed executed: superadm@adm.com created');
    } else {
      console.log('Seed skipped: users already exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap() {
  await runSeed();

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Drop CP API')
    .setDescription('API para controle de drops de CP de Lineage 2')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
