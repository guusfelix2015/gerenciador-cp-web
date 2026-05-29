import { Module } from '@nestjs/common';
import { DropsService } from './drops.service';
import { DropsController } from './drops.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  providers: [DropsService],
  controllers: [DropsController],
  exports: [DropsService],
})
export class DropsModule {}
