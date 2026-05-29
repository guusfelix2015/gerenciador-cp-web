import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findAll(filters?: { name?: string; grade?: string; workspaceId?: string }) {
    const where: any = {};

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    if (filters?.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters?.grade) {
      where.grade = filters.grade;
    }

    return this.prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, workspaceId?: string) {
    const where: any = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    const item = await this.prisma.item.findFirst({
      where,
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado');
    }

    return item;
  }

  async create(dto: CreateItemDto, workspaceId?: string, userId?: string) {
    const item = await this.prisma.item.create({
      data: {
        name: dto.name,
        grade: dto.grade,
        workspaceId,
      },
    });

    if (userId) {
      await this.auditLogs.log(
        'CREATE',
        'Item',
        item.id,
        userId,
        { after: { name: item.name, grade: item.grade } },
      );
    }

    return item;
  }

  async update(id: string, dto: UpdateItemDto, workspaceId?: string, userId?: string) {
    const existing = await this.findOne(id, workspaceId);

    const item = await this.prisma.item.update({
      where: { id },
      data: dto,
    });

    if (userId) {
      await this.auditLogs.log(
        'UPDATE',
        'Item',
        item.id,
        userId,
        {
          before: { name: existing.name, grade: existing.grade },
          after: { name: item.name, grade: item.grade },
        },
      );
    }

    return item;
  }

  async remove(id: string, workspaceId?: string, userId?: string) {
    const existing = await this.findOne(id, workspaceId);

    await this.prisma.item.delete({ where: { id } });

    if (userId) {
      await this.auditLogs.log(
        'DELETE',
        'Item',
        id,
        userId,
        { before: { name: existing.name, grade: existing.grade } },
      );
    }
  }
}
