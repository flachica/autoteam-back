import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class CreateHourDto {
  @ApiProperty({ example: '20:30', description: 'Hour of start' })
  @AutoMap()
  name: string;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: 0, description: 'Index' })
  @AutoMap()
  index: number;

  @IsNotEmpty()
  @ApiProperty({ example: 'Lunes', description: 'The day name' })
  @AutoMap()
  day_name: string;

  @IsNotEmpty()
  @ApiProperty({ example: 100, description: 'The price' })
  @AutoMap()
  price: number;

  @IsNotEmpty()
  @ApiProperty({ example: 'true', description: 'Active' })
  @AutoMap()
  active: boolean;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: '1', description: 'The group id' })
  @AutoMap()
  groupId: number;
}
