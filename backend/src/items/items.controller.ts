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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('items')
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os itens' })
  findAll(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('name') name?: string,
    @Query('grade') grade?: string,
  ) {
    return this.itemsService.findAll({ name, grade, workspaceId });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo item (Admin)' })
  create(
    @Body() dto: CreateItemDto,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemsService.create(dto, workspaceId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar item por ID' })
  findOne(@Param('id') id: string, @CurrentUser('workspaceId') workspaceId: string) {
    return this.itemsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar item (Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemsService.update(id, dto, workspaceId, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir item (Admin)' })
  remove(
    @Param('id') id: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemsService.remove(id, workspaceId, userId);
  }
}
