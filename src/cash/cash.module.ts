import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from '../club/club.entity';
import { ClubService } from '../club/club.service';
import { Court } from '../court/court.entity';
import { CourtService } from '../court/court.service';
import { HourGroup } from '../hour/hour-group.entity';
import { Hour } from '../hour/hour.entity';
import { HourService } from '../hour/hour.service';
import { Player } from '../player/player.entity';
import { PlayerService } from '../player/player.service';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';
import { Movement } from './movement.entity';
import { InvitedAnonPlayer } from 'src/court/invited.anon.player.entity';
import { InvitedPlayer } from 'src/court/invited.player.entity';
import { PlayerResponseDto } from 'src/player/dtos/player.response.dto';
import { MovementDto } from './dtos/movement.dto';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movement, MovementDto, Court, Club, Player, PlayerResponseDto, HourGroup, Hour, InvitedAnonPlayer, InvitedPlayer, PlayerResponseDto]),
  ],
  controllers: [CashController],
  providers: [
    CashService,
    CourtService,
    ClubService,
    PlayerService,
    HourService,
  ],
})
export class CashModule {}
