import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { AutoMap } from '../../decorators/automap';
import { Is24HourFormat } from '../../decorators/validators';
import { COURT_STATES } from '../court.constants';

export class CreateCourtDto {
  @ApiProperty({ example: 'Court 1', description: 'The name of the court' })
  @AutoMap()
  name?: string;

  @IsNotEmpty()
  @ApiProperty({ example: '2024-08-12', description: 'The date of the court' })
  @AutoMap()
  date: string;

  @IsNotEmpty()
  @ApiProperty({ example: '20:30', description: 'The hour of the court' })
  @AutoMap()
  @Is24HourFormat({
    message: 'The hour must be in the format HH:mm (24-hour format)',
  })
  hour: string;

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
  players: number[];

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 1, description: 'The club of the court' })
  @AutoMap()
  club: number;

  @IsOptional()
  @IsIn(COURT_STATES)
  @ApiProperty({ example: 'opened', description: 'The state of the court' })
  @AutoMap()
  state: string = 'opened';
}
