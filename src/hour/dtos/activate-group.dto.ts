import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class ActivateHourGroupDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ example: '1', description: 'Id of Group' })
  @AutoMap()
  id: number;

  @IsNotEmpty()
  @ApiProperty({ example: 'false', description: 'De/Active' })
  @AutoMap()
  active: string;
}
