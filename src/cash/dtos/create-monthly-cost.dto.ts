import { ApiProperty } from '@nestjs/swagger';

export class CreateMonthlyCostDto {
  @ApiProperty()
  month: number;

  @ApiProperty()
  year: number;

  @ApiProperty()
  amount: number;
}
