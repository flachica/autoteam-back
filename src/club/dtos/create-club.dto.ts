import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({ example: 'Central Club', description: 'The name of the club' })
  name: string;

  players?: [];
}
