import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  providers: [ItemsService],
  controllers: [ItemsController],
  exports: [ItemsService],
})
export class ItemsModule {}
