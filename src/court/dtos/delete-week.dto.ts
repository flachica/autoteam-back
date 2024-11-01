import { IsInt, IsNotEmpty } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class DeleteWeekDto {
  @IsNotEmpty()
  @AutoMap()
  date: string;

  @IsNotEmpty()
  @IsInt()
  @AutoMap()
  clubId: number;
}
