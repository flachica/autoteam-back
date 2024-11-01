import { IsNotEmpty } from 'class-validator';

export class FilterAllMovementDto {
  dateFrom: string;
  dateTo: string;
  @IsNotEmpty()
  page: number;
  @IsNotEmpty()
  pageSize: number;
}
