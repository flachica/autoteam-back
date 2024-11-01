import { IsNotEmpty, IsOptional } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class MovementDto {
  id: number;
  type: 'in' | 'out';
  name: string;
  amount: number;
  date: string;
}
