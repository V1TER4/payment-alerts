import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Administrador' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'admin@contas.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}
