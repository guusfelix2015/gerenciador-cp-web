import { IsString, IsOptional, IsNumberString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDropItemDto {
  @ApiPropertyOptional({ example: 'cuid-do-item' })
  @IsOptional()
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ example: 'Dark Crystal Armor' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  itemName?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsNumberString()
  quantity: string;

  @ApiPropertyOptional({ example: '500k' })
  @IsString()
  unitValue: string;
}
