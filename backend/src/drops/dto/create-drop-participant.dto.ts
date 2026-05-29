import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDropParticipantDto {
  @ApiProperty({ example: 'cuid-do-usuario' })
  @IsString()
  userId: string;
}
