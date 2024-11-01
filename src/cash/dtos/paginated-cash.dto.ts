import { MovementDto } from './movement.dto';

export class PaginatedMovements {
  items: MovementDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  balance: number;
  futureBalance: number;
}
