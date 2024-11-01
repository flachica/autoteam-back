import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class AuthenticateInfoDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'Hashed password' })
  @AutoMap()
  password: string;

  @IsOptional()
  @AutoMap()
  phone?: string;

  @IsOptional()
  @ApiProperty({
    example: 'account@domain.suffix',
    description: 'The email of the player',
  })
  email?: string;
}
