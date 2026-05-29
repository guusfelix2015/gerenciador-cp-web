import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(filters?: { startDate?: string; endDate?: string; workspaceId?: string; type?: string }) {
    const where = this.buildDateFilter(filters);

    const [
      totalDrops,
      totalValue,
      dropsByDay,
      valueByDay,
      topItem,
      itemsRanking,
    ] = await Promise.all([
      this.prisma.drop.count({ where }),
      this.getTotalValue(where),
      this.getDropsByDay(where),
      this.getValueByDay(where),
      this.getTopItem(where),
      this.getItemsRanking(where),
    ]);

    const dayWithHighestValue = this.getDayWithHighestValue(valueByDay);

    return {
      totalValue,
      totalDrops,
      dayWithHighestValue,
      topItem,
      dropsByDay,
      valueByDay,
      itemsRanking,
    };
  }

  private buildDateFilter(filters?: { startDate?: string; endDate?: string; workspaceId?: string; type?: string }) {
    const where: any = {};
    if (filters?.workspaceId) {
      where.workspaceId = filters.workspaceId;
    }
    if (filters?.type) {
      where.type = filters.type;
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
    return where;
  }

  private async getTotalValue(where?: any) {
    const result = await this.prisma.drop.aggregate({
      where,
      _sum: {
        totalValue: true,
      },
    });

    return result._sum.totalValue ?? 0;
  }

  private async getDropsByDay(where?: any) {
    const drops = await this.prisma.drop.findMany({
      where,
      select: {
        dropDate: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const drop of drops) {
      const dateStr = drop.dropDate.toISOString().split('T')[0];
      grouped[dateStr] = (grouped[dateStr] ?? 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private async getValueByDay(where?: any) {
    const drops = await this.prisma.drop.findMany({
      where,
      select: {
        dropDate: true,
        totalValue: true,
      },
    });

    const grouped: Record<string, number> = {};

    for (const drop of drops) {
      const dateStr = drop.dropDate.toISOString().split('T')[0];
      grouped[dateStr] = (grouped[dateStr] ?? 0) + drop.totalValue;
    }

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      value,
    }));
  }

  private getDayWithHighestValue(
    valueByDay: { date: string; value: number }[],
  ) {
    if (valueByDay.length === 0) {
      return null;
    }

    return valueByDay.reduce((max, current) =>
      current.value > max.value ? current : max,
    );
  }

  private async getTopItem(where?: any) {
    let items;
    if (where && Object.keys(where).length > 0) {
      items = await this.prisma.dropItem.groupBy({
        by: ['itemName'],
        where: {
          drop: where,
        },
        _sum: {
          quantity: true,
        },
      });
    } else {
      items = await this.prisma.dropItem.groupBy({
        by: ['itemName'],
        _sum: {
          quantity: true,
        },
      });
    }

    if (items.length === 0) {
      return null;
    }

    const top = items.reduce((max, current) =>
      (current._sum.quantity ?? 0) > (max._sum.quantity ?? 0)
        ? current
        : max,
    );

    return {
      itemName: top.itemName,
      totalQuantity: top._sum.quantity ?? 0,
    };
  }

  private async getItemsRanking(where?: any) {
    let items;
    if (where && Object.keys(where).length > 0) {
      items = await this.prisma.dropItem.groupBy({
        by: ['itemName'],
        where: {
          drop: where,
        },
        _sum: {
          quantity: true,
          totalValue: true,
        },
      });
    } else {
      items = await this.prisma.dropItem.groupBy({
        by: ['itemName'],
        _sum: {
          quantity: true,
          totalValue: true,
        },
      });
    }

    return items
      .map((item) => ({
        itemName: item.itemName,
        totalQuantity: item._sum.quantity ?? 0,
        totalValue: item._sum.totalValue ?? 0,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
  }
}
