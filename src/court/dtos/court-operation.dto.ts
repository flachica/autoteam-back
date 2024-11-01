import { IsArray, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { AutoMap } from '../../decorators/automap';
import { ApiProperty } from '@nestjs/swagger';

export class CourtOperationDto {
  @IsNotEmpty()
  @IsInt()
  @AutoMap()
  playerId: number;

  @IsOptional()
  @IsInt()
  @AutoMap()
  toPlayerId: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: ["Anon Player 1", "Anon Player 2", "Anon Player 3"],
    description: 'Anon players',
  })
  @AutoMap()
  anonPlayers: string;

  @IsOptional()
  @IsArray()
  @ApiProperty({
    example: [1, 2, 3],
    description: 'The players of the court',
  })
  @AutoMap()
  invitedPlayers?: number[];
}
