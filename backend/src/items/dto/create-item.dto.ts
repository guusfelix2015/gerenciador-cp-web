import { IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemGrade } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ example: 'Dark Crystal Armor' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ enum: ItemGrade, example: ItemGrade.A })
  @IsEnum(ItemGrade)
  grade: ItemGrade;
}
