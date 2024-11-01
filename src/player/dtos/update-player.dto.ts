import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
} from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class UpdatePlayerDto {
  @IsOptional()
  @ApiProperty({ example: 'John', description: 'The name of the player' })
  @AutoMap()
  name?: string;

  @IsOptional()
  @ApiProperty({
    example: 'Doe',
    description: 'The surname of the player',
    required: false,
  })
  surname?: string;

  @IsOptional()
  @Matches(/^[0-9]{9}$/, {
    message:
      'El teléfono debe tener exactamente 9 caracteres numéricos del 0 al 9',
  })
  @ApiProperty({
    example: '123456789',
    description:
      'The phone number of the player, must be exactly 9 digits from 0 to 9',
  })
  @AutoMap()
  phone?: string;

  @IsOptional()
  @ApiProperty({
    example: 'account@domain.suffix',
    description: 'The email of the player',
  })
  email?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @IsOptional()
  @ApiProperty({
    example: [1, 2, 3],
    description: 'List of club IDs the player is associated with',
    type: [Number],
    required: false,
  })
  @AutoMap()
  clubs?: [];

  @IsOptional()
  @IsIn(['player', 'vip', 'admin'])
  @ApiProperty({
    example: 'player',
    description: 'The role of the player',
  })
  @AutoMap()
  role?: string;

  @IsOptional()
  @AutoMap()
  password?: string;

  @IsOptional()
  @AutoMap()
  balance?: number;
}
