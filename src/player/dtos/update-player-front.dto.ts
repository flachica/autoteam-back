import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class UpdatePlayerFrontDto {
  @IsOptional()
  @ApiProperty({ description: 'Hashed password' })
  @AutoMap()
  currentPassword?: string;

  @ApiProperty({ description: 'Hashed password' })
  @AutoMap()
  password?: string;

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
  @ApiProperty({
    example: 'clubIds',
    description: 'List of club IDs the player is associated with',
    required: false,
  })
  @AutoMap()
  clubIds?: number[];

  @IsOptional()
  role?: string;

  @IsOptional()
  balance?: number;
}
