import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Club } from '../club/club.entity';
import { ClubModule } from '../club/club.module';
import { PlayerController } from './player.controller';
import { Player } from './player.entity';
import { PlayerService } from './player.service';
import { PlayerResponseDto } from './dtos/player.response.dto';
import { CashService } from 'src/cash/cash.service';
import { CashModule } from 'src/cash/cash.module';
import { Movement } from 'src/cash/movement.entity';
import { MovementDto } from 'src/cash/dtos/movement.dto';
import { CourtService } from 'src/court/court.service';
import { Court } from 'src/court/court.entity';
import { Hour } from 'src/hour/hour.entity';
import { HourGroup } from 'src/hour/hour-group.entity';
import { InvitedPlayer } from 'src/court/invited.player.entity';
import { InvitedAnonPlayer } from 'src/court/invited.anon.player.entity';
import { CourtModule } from 'src/court/court.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, Club, PlayerResponseDto, Movement, MovementDto, Court, HourGroup, Hour, InvitedPlayer, InvitedAnonPlayer]),
    ClubModule,
    CashModule,
    CourtModule,
    forwardRef(() => AuthModule),
  ],
  providers: [PlayerService, CashService, CourtService],
  controllers: [PlayerController],
})
export class PlayerModule {}
