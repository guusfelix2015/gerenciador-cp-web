import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { parseAdena } from '../common/utils/adena.util';

@Injectable()
export class DropsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findByParticipant(userId: string, workspaceId?: string) {
    const participants = await this.prisma.dropParticipant.findMany({
      where: {
        userId,
        drop: workspaceId ? { workspaceId } : undefined,
      },
      include: {
        drop: {
          include: {
            items: true,
            participants: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        drop: {
          dropDate: 'desc',
        },
      },
    });

    const drops = participants.map((p) => {
      const splitValue =
        p.drop.participants.length > 0
          ? Math.floor(p.drop.totalValue / p.drop.participants.length)
          : 0;
      return {
        ...p.drop,
        splitValue,
        myStatus: p.paymentStatus,
      };
    });

    const totalEarned = drops.reduce((sum, d) => sum + (d.splitValue ?? 0), 0);
    const totalPending = drops
      .filter((d) => d.myStatus === 'PENDING')
      .reduce((sum, d) => sum + (d.splitValue ?? 0), 0);
    const totalPaid = drops
      .filter((d) => d.myStatus === 'PAID')
      .reduce((sum, d) => sum + (d.splitValue ?? 0), 0);

    const dropsByDay: Record<string, number> = {};
    for (const drop of drops) {
      const dateStr = drop.dropDate.toISOString().split('T')[0];
      dropsByDay[dateStr] = (dropsByDay[dateStr] ?? 0) + (drop.splitValue ?? 0);
    }

    return {
      drops,
      stats: {
        totalDrops: drops.length,
        totalEarned,
        totalPending,
        totalPaid,
      },
      earningsByDay: Object.entries(dropsByDay).map(([date, value]) => ({
        date,
        value,
      })),
    };
  }

  async findAll(filters?: {
    title?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    workspaceId?: string;
  }) {
    const where: any = {};

    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }

    if (filters?.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }

    if (filters?.startDate || filters?.endDate) {
      where.dropDate = {};
      if (filters.startDate) {
        where.dropDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.dropDate.lte = new Date(filters.endDate);
      }
    }

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.max(1, Math.min(100, filters?.limit ?? 10));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.drop.findMany({
        where,
        orderBy: { dropDate: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          participants: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.drop.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, workspaceId?: string) {
    const where: any = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    const drop = await this.prisma.drop.findFirst({
      where,
      include: {
        items: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
            paidBy: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!drop) {
      throw new NotFoundException('Drop não encontrado');
    }

    const splitValue =
      drop.participants.length > 0
        ? Math.floor(drop.totalValue / drop.participants.length)
        : 0;

    return {
      ...drop,
      splitValue,
    };
  }

  async create(dto: CreateDropDto, createdById: string, workspaceId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O drop deve ter pelo menos 1 item');
    }

    if (!dto.participants || dto.participants.length === 0) {
      throw new BadRequestException('O drop deve ter pelo menos 1 participante');
    }

    const dropItems = await this.buildDropItems(dto.items);
    const totalValue = dropItems.reduce((sum, item) => sum + item.totalValue, 0);

    const drop = await this.prisma.drop.create({
      data: {
        title: dto.title,
        type: dto.type,
        dropDate: new Date(dto.dropDate),
        totalValue,
        notes: dto.notes,
        createdById,
        workspaceId,
        items: {
          create: dropItems,
        },
        participants: {
          create: dto.participants.map((p) => ({ userId: p.userId })),
        },
      },
      include: {
        items: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    await this.auditLogs.log(
      'CREATE',
      'Drop',
      drop.id,
      createdById,
      { after: { title: drop.title, type: drop.type, totalValue: drop.totalValue } },
    );

    const splitValue =
      drop.participants.length > 0
        ? Math.floor(drop.totalValue / drop.participants.length)
        : 0;

    return {
      ...drop,
      splitValue,
    };
  }

  async update(
    id: string,
    dto: UpdateDropDto,
    workspaceId?: string,
    userId?: string,
  ) {
    const existing = await this.findOne(id, workspaceId);

    if (dto.items !== undefined && (!dto.items || dto.items.length === 0)) {
      throw new BadRequestException('O drop deve ter pelo menos 1 item');
    }

    if (
      dto.participants !== undefined &&
      (!dto.participants || dto.participants.length === 0)
    ) {
      throw new BadRequestException('O drop deve ter pelo menos 1 participante');
    }

    const data: any = {};

    if (dto.title) data.title = dto.title;
    if (dto.type) data.type = dto.type;
    if (dto.dropDate) data.dropDate = new Date(dto.dropDate);
    if (dto.notes !== undefined) data.notes = dto.notes;

    if (dto.items) {
      const dropItems = await this.buildDropItems(dto.items);
      const totalValue = dropItems.reduce((sum, item) => sum + item.totalValue, 0);
      data.totalValue = totalValue;
      data.items = {
        deleteMany: {},
        create: dropItems,
      };
    }

    if (dto.participants) {
      data.participants = {
        deleteMany: {},
        create: dto.participants.map((p) => ({ userId: p.userId })),
      };
    }

    const drop = await this.prisma.drop.update({
      where: { id },
      data,
      include: {
        items: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (userId) {
      await this.auditLogs.log(
        'UPDATE',
        'Drop',
        drop.id,
        userId,
        {
          before: { title: existing.title, type: existing.type, totalValue: existing.totalValue },
          after: { title: drop.title, type: drop.type, totalValue: drop.totalValue },
        },
      );
    }

    const splitValue =
      drop.participants.length > 0
        ? Math.floor(drop.totalValue / drop.participants.length)
        : 0;

    return {
      ...drop,
      splitValue,
    };
  }

  async remove(id: string, workspaceId?: string, userId?: string) {
    const existing = await this.findOne(id, workspaceId);

    await this.prisma.drop.delete({ where: { id } });

    if (userId) {
      await this.auditLogs.log(
        'DELETE',
        'Drop',
        id,
        userId,
        { before: { title: existing.title, type: existing.type, totalValue: existing.totalValue } },
      );
    }
  }

  async payParticipant(
    dropId: string,
    participantId: string,
    paidById: string,
    workspaceId?: string,
  ) {
    const drop = await this.findOne(dropId, workspaceId);
    const participant = drop.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participante não encontrado no drop');
    }

    const updated = await this.prisma.dropParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        paidById,
      },
      include: {
        user: { select: { id: true, name: true } },
        drop: { select: { title: true } },
      },
    });

    await this.auditLogs.log(
      'PAY',
      'DropParticipant',
      participantId,
      paidById,
      {
        dropId,
        participantName: updated.user.name,
        amount: drop.splitValue,
      },
    );

    return updated;
  }

  async unpayParticipant(
    dropId: string,
    participantId: string,
    workspaceId?: string,
  ) {
    const drop = await this.findOne(dropId, workspaceId);
    const participant = drop.participants.find((p) => p.id === participantId);
    if (!participant) {
      throw new NotFoundException('Participante não encontrado no drop');
    }

    return this.prisma.dropParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus: 'PENDING',
        paidAt: null,
        paidById: null,
      },
    });
  }

  async payAllParticipants(dropId: string, paidById: string, workspaceId?: string) {
    const drop = await this.findOne(dropId, workspaceId);
    const pendingParticipants = drop.participants.filter(
      (p) => p.paymentStatus !== 'PAID',
    );

    for (const participant of pendingParticipants) {
      await this.prisma.dropParticipant.update({
        where: { id: participant.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          paidById,
        },
      });
    }

    await this.auditLogs.log(
      'PAY_ALL',
      'Drop',
      dropId,
      paidById,
      { participantsCount: pendingParticipants.length, totalAmount: drop.splitValue * pendingParticipants.length },
    );

    return this.findOne(dropId, workspaceId);
  }

  async getBalanceByMember(workspaceId?: string) {
    const participants = await this.prisma.dropParticipant.findMany({
      where: {
        paymentStatus: 'PENDING',
        drop: workspaceId ? { workspaceId } : undefined,
      },
      include: {
        user: { select: { id: true, name: true } },
        drop: { select: { id: true, title: true, totalValue: true } },
      },
    });

    const balanceMap: Record<string, { userId: string; name: string; totalPending: number; drops: any[] }> = {};

    for (const p of participants) {
      const participantCount = await this.getParticipantCount(p.drop.id);
      const splitValue =
        p.drop.totalValue > 0 && participantCount > 0
          ? Math.floor(p.drop.totalValue / participantCount)
          : 0;

      if (!balanceMap[p.user.id]) {
        balanceMap[p.user.id] = {
          userId: p.user.id,
          name: p.user.name,
          totalPending: 0,
          drops: [],
        };
      }

      balanceMap[p.user.id].totalPending += splitValue;
      balanceMap[p.user.id].drops.push({
        dropId: p.drop.id,
        dropTitle: p.drop.title,
        participantId: p.id,
        splitValue,
      });
    }

    return Object.values(balanceMap).sort((a, b) => b.totalPending - a.totalPending);
  }

  async bulkPay(payload: { dropId: string; participantIds: string[] }[], paidById: string, workspaceId?: string) {
    for (const entry of payload) {
      for (const participantId of entry.participantIds) {
        await this.payParticipant(entry.dropId, participantId, paidById, workspaceId);
      }
    }
    return { success: true };
  }

  private async getParticipantCount(dropId: string) {
    return this.prisma.dropParticipant.count({ where: { dropId } });
  }

  async exportToCsv(filters?: {
    startDate?: string;
    endDate?: string;
    workspaceId?: string;
  }) {
    const where: any = {};
    if (filters?.workspaceId) where.workspaceId = filters.workspaceId;
    if (filters?.startDate || filters?.endDate) {
      where.dropDate = {};
      if (filters.startDate) where.dropDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.dropDate.lte = new Date(filters.endDate);
    }

    const drops = await this.prisma.drop.findMany({
      where,
      orderBy: { dropDate: 'desc' },
      include: {
        items: true,
        participants: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const header = ['Data', 'Título', 'Tipo', 'Valor Total', 'Participantes', 'Split', 'Itens'];
    const rows = drops.map((drop) => {
      const participants = drop.participants.map((p) => p.user.name).join('; ');
      const items = drop.items.map((i) => `${i.itemName} x${i.quantity}`).join('; ');
      const split = drop.participants.length > 0 ? Math.floor(drop.totalValue / drop.participants.length) : 0;
      return [
        drop.dropDate.toISOString().split('T')[0],
        `"${drop.title}"`,
        drop.type,
        drop.totalValue,
        `"${participants}"`,
        split,
        `"${items}"`,
      ];
    });

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }

  private async buildDropItems(items: any[]) {
    const result = [];

    for (const item of items) {
      const quantity = parseInt(item.quantity, 10);
      const unitValue = parseAdena(item.unitValue);

      if (isNaN(quantity) || quantity <= 0) {
        throw new BadRequestException('Quantidade do item deve ser um número positivo');
      }

      if (unitValue < 0) {
        throw new BadRequestException('Valor unitário do item não pode ser negativo');
      }

      let itemName = item.itemName;
      let itemId = item.itemId;

      if (itemId && !itemName) {
        const dbItem = await this.prisma.item.findUnique({
          where: { id: itemId },
        });

        if (!dbItem) {
          throw new BadRequestException(`Item com ID ${itemId} não encontrado`);
        }

        itemName = dbItem.name;
      }

      if (!itemName) {
        throw new BadRequestException('Nome do item é obrigatório quando não informado itemId');
      }

      result.push({
        itemId: itemId || null,
        itemName,
        quantity,
        unitValue,
        totalValue: quantity * unitValue,
      });
    }

    return result;
  }
}
