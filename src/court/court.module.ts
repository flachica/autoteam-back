import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/club.entity';
import { ClubModule } from '../club/club.module';
import { HourGroup } from '../hour/hour-group.entity';
import { Hour } from '../hour/hour.entity';
import { HourModule } from '../hour/hour.module';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { CourtController } from './court.controller';
import { Court } from './court.entity';
import { CourtService } from './court.service';
import { InvitedAnonPlayer } from './invited.anon.player.entity';
import { InvitedPlayer } from './invited.player.entity';
import { CashService } from '../cash/cash.service';
import { Movement } from '../cash/movement.entity';
import { CashModule } from '../cash/cash.module';
import { PlayerResponseDto } from '../player/dtos/player.response.dto';
import { PlayerService } from '../player/player.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Court,
      Player,
      InvitedAnonPlayer,
      InvitedPlayer,
      Club,
      HourGroup,
      Hour,
      Movement,
      PlayerResponseDto,
    ]),
    ClubModule,
    HourModule,
    CashModule,
  ],
  providers: [CourtService, CashService, PlayerService],
  controllers: [CourtController],
})
export class CourtModule {}
