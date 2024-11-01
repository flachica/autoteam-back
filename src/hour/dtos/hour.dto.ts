import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '../../decorators/automap';

export class HourDto {
  @ApiProperty({ example: '1', description: 'Hour ID' })
  @AutoMap()
  id: number;

  @ApiProperty({ example: 'Verano', description: 'Hour name' })
  @AutoMap()
  name: string;

  @ApiProperty({ example: 100, description: 'Price of the hour' })
  @AutoMap()
  price: number;
}

export class DayDto {
  @ApiProperty({ example: 'Lunes', description: 'Day name' })
  @AutoMap()
  day_name: string;

  @ApiProperty({ example: '20:30', description: 'Hour of enabled start time' })
  hours: HourDto[];
}

export class GroupedHourDto {
  @ApiProperty({ example: '1', description: 'Hour group ID' })
  @AutoMap()
  id: number;

  @ApiProperty({ example: 'Verano', description: 'Hour group' })
  @AutoMap()
  group_name: string;

  @ApiProperty({
    example: ['20:30', '21:30'],
    description: 'Hours of enabled start time',
  })
  days: DayDto[];

  @ApiProperty({ example: true, description: 'Hour group status' })
  @AutoMap()
  active: boolean;
}
