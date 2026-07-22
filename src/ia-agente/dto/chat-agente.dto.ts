import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatAgenteDto {
  @ApiProperty({ example: 'hola, dime el estado de mis viajes' })
  @IsString()
  @IsNotEmpty()
  mensaje!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  context?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  input?: any;
}