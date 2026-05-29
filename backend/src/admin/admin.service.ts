import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAllWorkspaces() {
    const workspaces = await this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            users: true,
            drops: true,
            items: true,
          },
        },
      },
    });

    return workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      isActive: ws.isActive,
      createdAt: ws.createdAt,
      users: ws.users,
      counts: {
        users: ws._count.users,
        drops: ws._count.drops,
        items: ws._count.items,
      },
    }));
  }

  async toggleWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      throw new Error('Workspace não encontrado');
    }

    const updated = await this.prisma.workspace.update({
      where: { id },
      data: { isActive: !workspace.isActive },
    });

    return updated;
  }
}
