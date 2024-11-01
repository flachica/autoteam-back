import { IsNotEmpty, IsOptional } from 'class-validator';

export class FilterMovementDto {
  @IsNotEmpty()
  playerId: number;
  dateFrom: string;
  dateTo: string;
  @IsNotEmpty()
  page: number;
  @IsNotEmpty()
  pageSize: number;
  @IsOptional()
  courtId?: number;
}
