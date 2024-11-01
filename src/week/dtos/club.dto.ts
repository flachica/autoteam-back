import { CourtDto } from './court.dto';

export class ClubDto {
  id: number;
  name: string;
  courts: CourtDto[];
}
