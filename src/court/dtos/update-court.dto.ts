import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional } from 'class-validator';
import { AutoMap } from '../../decorators/automap';
import { Transform } from 'class-transformer';
import { COURT_STATES } from '../court.constants';

export class UpdateCourtDto {
  @IsOptional()
  @ApiProperty({ example: 'John Doe', description: 'The name of the player' })
  @AutoMap()
  name?: string;

  @IsOptional()
  @ApiProperty({ example: '2024-08-12', description: 'The date of the court' })
  @AutoMap()
  date?: Date;

  @IsInt()
  @IsOptional()
  @ApiProperty({ example: 5, description: 'The minimum number of players' })
  @Transform(({ value }) => value ?? 4)
  @AutoMap()
  minPlayers: number = 4;

  @IsInt()
  @IsOptional()
  @ApiProperty({ example: 5, description: 'The maximum number of players' })
  @Transform(({ value }) => value ?? 4)
  @AutoMap()
  maxPlayers: number = 4;

  @ApiProperty({ example: 5.6, description: 'Court price per person' })
  @AutoMap()
  price: number;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    example: [1, 2, 3],
    description: 'The players of the court',
  })
  @AutoMap()
  players?: number[];

  @IsInt()
  @IsOptional()
  @ApiProperty({ example: 1, description: 'The club of the court' })
  @AutoMap()
  club?: number;

  @IsOptional()
  @IsIn(COURT_STATES)
  @ApiProperty({ example: 'opened', description: 'The state of the court' })
  @AutoMap()
  state?: string = 'opened';
}
