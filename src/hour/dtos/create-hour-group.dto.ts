import { ApiProperty } from '@nestjs/swagger';
import { AutoMap } from '../../decorators/automap';

export class CreateHourGroupDto {
  @ApiProperty({ example: 'Verano', description: 'Group name' })
  @AutoMap()
  name: string;
}
