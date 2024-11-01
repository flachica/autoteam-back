import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { AutoMap } from '../../decorators/automap';

export class AuthenticateGoogleDto {
  @IsNotEmpty()
  @AutoMap()
  token: string;
}
