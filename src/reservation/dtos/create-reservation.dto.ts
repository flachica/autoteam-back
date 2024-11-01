import { IsInt, IsOptional, IsString } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class CreateReservationDto {
  @IsInt()
  @AutoMap()
  courtId: number;

  @IsInt()
  @AutoMap()
  playerId: number;

  @IsString()
  @IsOptional()
  @AutoMap()
  name: string;
}
