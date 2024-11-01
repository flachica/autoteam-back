import { IsInt, IsNotEmpty } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class OpenWeekDto {
  @IsNotEmpty()
  @AutoMap()
  date: string;

  @IsNotEmpty()
  @IsInt()
  @AutoMap()
  clubId: number;

  @IsNotEmpty()
  @AutoMap()
  hour: string;
}
