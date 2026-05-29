import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.leaderEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const slug = generateSlug(dto.cpName);
    const existingWorkspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new ConflictException('Nome da CP já está em uso');
    }

    const passwordHash = await bcrypt.hash(dto.leaderPassword, 10);

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.cpName,
        slug,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.leaderName,
        email: dto.leaderEmail,
        passwordHash,
        role: UserRole.ADMIN,
        workspaceId: workspace.id,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.role !== UserRole.SUPER_ADMIN && user.workspace && !user.workspace.isActive) {
      throw new UnauthorizedException('O acesso da sua CP foi desativado. Entre em contato com o suporte.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace?.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      workspace: user.workspace
        ? {
            id: user.workspace.id,
            name: user.workspace.name,
            slug: user.workspace.slug,
            isActive: user.workspace.isActive,
          }
        : null,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workspace: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      workspace: user.workspace
        ? {
            id: user.workspace.id,
            name: user.workspace.name,
            slug: user.workspace.slug,
          }
        : null,
    };
  }
}
