import { IsString, MinLength, IsEnum, IsDateString, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DropType } from '@prisma/client';
import { CreateDropItemDto } from './create-drop-item.dto';
import { CreateDropParticipantDto } from './create-drop-participant.dto';

export class CreateDropDto {
  @ApiProperty({ example: 'Farm de RB Valakas' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ enum: DropType, example: DropType.BOSS })
  @IsEnum(DropType)
  type: DropType;

  @ApiProperty({ example: '2024-05-20' })
  @IsDateString()
  dropDate: string;

  @ApiPropertyOptional({ example: 'Notas sobre o drop' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateDropItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDropItemDto)
  @ArrayMinSize(1, { message: 'O drop deve ter pelo menos 1 item' })
  items: CreateDropItemDto[];

  @ApiProperty({ type: [CreateDropParticipantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDropParticipantDto)
  @ArrayMinSize(1, { message: 'O drop deve ter pelo menos 1 participante' })
  participants: CreateDropParticipantDto[];
}
