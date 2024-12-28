import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateMovementDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  playerId: number;

  @IsOptional()
  @ApiProperty()
  courtId?: number;

  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsOptional()
  @ApiProperty()
  validated?: boolean;

  @IsOptional()
  @ApiProperty()
  unchangeBalance?: boolean;
}
