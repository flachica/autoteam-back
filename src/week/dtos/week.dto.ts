import { ClubDto } from './club.dto';

export class WeekDto {
  clubs: ClubDto[];
  week: string;
  currentBalance: number;
}
