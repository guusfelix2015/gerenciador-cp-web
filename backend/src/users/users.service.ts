import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  async findAll(workspaceId?: string) {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async create(dto: CreateUserDto, workspaceId?: string, userId?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role ?? UserRole.MEMBER,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (userId) {
      await this.auditLogs.log(
        'CREATE',
        'User',
        user.id,
        userId,
        { after: { name: user.name, email: user.email, role: user.role } },
      );
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, userId?: string) {
    const existing = await this.findOne(id);

    const data: any = { ...dto };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password;
    }

    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (userId) {
      await this.auditLogs.log(
        'UPDATE',
        'User',
        user.id,
        userId,
        {
          before: { name: existing.name, email: existing.email, role: existing.role },
          after: { name: user.name, email: user.email, role: user.role },
        },
      );
    }

    return user;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    if (userId) {
      await this.auditLogs.log(
        'DELETE',
        'User',
        id,
        userId,
        { before: { name: existing.name, email: existing.email, role: existing.role } },
      );
    }
  }
}
