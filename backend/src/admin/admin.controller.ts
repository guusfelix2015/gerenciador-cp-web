import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('workspaces')
  @ApiOperation({ summary: 'Listar todas as CPs com membros (Super Admin)' })
  findAllWorkspaces() {
    return this.adminService.findAllWorkspaces();
  }

  @Patch('workspaces/:id/toggle')
  @ApiOperation({ summary: 'Ativar/Desativar uma CP (Super Admin)' })
  toggleWorkspace(@Param('id') id: string) {
    return this.adminService.toggleWorkspace(id);
  }
}
