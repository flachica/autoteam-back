import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CashModule } from '../cash/cash.module';
import { CashService } from '../cash/cash.service';
import { MovementDto } from '../cash/dtos/movement.dto';
import { Movement } from '../cash/movement.entity';
import { Club } from '../club/club.entity';
import { ClubModule } from '../club/club.module';
import { Court } from '../court/court.entity';
import { CourtModule } from '../court/court.module';
import { CourtService } from '../court/court.service';
import { InvitedAnonPlayer } from '../court/invited.anon.player.entity';
import { InvitedPlayer } from '../court/invited.player.entity';
import { HourGroup } from '../hour/hour-group.entity';
import { Hour } from '../hour/hour.entity';
import { PlayerResponseDto } from './dtos/player.response.dto';
import { PlayerController } from './player.controller';
import { Player } from './player.entity';
import { PlayerService } from './player.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      Club,
      PlayerResponseDto,
      Movement,
      MovementDto,
      Court,
      HourGroup,
      Hour,
      InvitedPlayer,
      InvitedAnonPlayer,
    ]),
    ClubModule,
    CashModule,
    CourtModule,
    forwardRef(() => AuthModule),
  ],
  providers: [PlayerService, CashService, CourtService],
  controllers: [PlayerController],
})
export class PlayerModule {}
