import { CourtAnonPlayerDto } from './courtAnonPlayer.dto';
import { CourtPlayerDto } from './courtPlayer.dto';

export class CourtDto {
  id: number;
  name: string;
  players: CourtPlayerDto[];
  invitedPlayers: CourtPlayerDto[];
  anonPlayers: CourtAnonPlayerDto[];
  day_name: string;
  day_date: string;
  hour: string;
  price: number;
  court_state: string;
}
