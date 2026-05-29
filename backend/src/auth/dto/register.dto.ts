import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Red Dragons' })
  @IsString()
  @MinLength(2)
  cpName: string;

  @ApiProperty({ example: 'Gustavo' })
  @IsString()
  @MinLength(2)
  leaderName: string;

  @ApiProperty({ example: 'gustavo@red-dragons.com' })
  @IsEmail()
  leaderEmail: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(4)
  leaderPassword: string;
}
