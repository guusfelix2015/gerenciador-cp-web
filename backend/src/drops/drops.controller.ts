import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { DropsService } from './drops.service';
import { CreateDropDto } from './dto/create-drop.dto';
import { UpdateDropDto } from './dto/update-drop.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Drops')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drops')
export class DropsController {
  constructor(private dropsService: DropsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os drops' })
  findAll(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('title') title?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dropsService.findAll({
      title,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      workspaceId,
    });
  }

  @Get('balance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Saldo acumulado pendente por membro' })
  getBalance(@CurrentUser('workspaceId') workspaceId: string) {
    return this.dropsService.getBalanceByMember(workspaceId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar drops do usuário logado' })
  findMyDrops(@CurrentUser() user: any) {
    return this.dropsService.findByParticipant(user.userId, user.workspaceId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar drops para CSV' })
  async exportCsv(
    @Res() res: Response,
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csv = await this.dropsService.exportToCsv({ startDate, endDate, workspaceId });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="drops.csv"');
    res.send(csv);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo drop (Admin)' })
  create(@Body() dto: CreateDropDto, @CurrentUser() user: any) {
    return this.dropsService.create(dto, user.userId, user.workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar drop por ID' })
  findOne(@Param('id') id: string, @CurrentUser('workspaceId') workspaceId: string) {
    return this.dropsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar drop (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDropDto,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.dropsService.update(id, dto, workspaceId, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir drop (Admin)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.dropsService.remove(id, workspaceId, userId);
  }

  @Post(':id/participants/:participantId/pay')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Marcar participante como pago (Admin)' })
  payParticipant(
    @Param('id') dropId: string,
    @Param('participantId') participantId: string,
    @CurrentUser() user: any,
  ) {
    return this.dropsService.payParticipant(dropId, participantId, user.userId, user.workspaceId);
  }

  @Post(':id/participants/:participantId/unpay')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reverter participante para pendente (Admin)' })
  unpayParticipant(
    @Param('id') dropId: string,
    @Param('participantId') participantId: string,
    @CurrentUser('workspaceId') workspaceId: string,
  ) {
    return this.dropsService.unpayParticipant(dropId, participantId, workspaceId);
  }

  @Post(':id/pay-all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Pagar todos os participantes do drop (Admin)' })
  payAll(
    @Param('id') dropId: string,
    @CurrentUser() user: any,
  ) {
    return this.dropsService.payAllParticipants(dropId, user.userId, user.workspaceId);
  }

  @Post('bulk-pay')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Pagamento em lote (Admin)' })
  bulkPay(
    @Body() payload: { dropId: string; participantIds: string[] }[],
    @CurrentUser() user: any,
  ) {
    return this.dropsService.bulkPay(payload, user.userId, user.workspaceId);
  }
}
