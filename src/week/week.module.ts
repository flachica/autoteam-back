import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CombinedGuard } from '../auth/guards/combined.guard';
import { Club } from '../club/club.entity';
import { ClubModule } from '../club/club.module';
import { Court } from '../court/court.entity';
import { CourtModule } from '../court/court.module';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { PlayerService } from '../player/player.service';
import { WeekDto } from '../week/dtos/week.dto';
import { WeekController } from './week.controller';
import { WeekService } from './week.service';
import { InvitedPlayer } from 'src/court/invited.player.entity';
import { CashService } from 'src/cash/cash.service';
import { Movement } from 'src/cash/movement.entity';
import { PlayerResponseDto } from 'src/player/dtos/player.response.dto';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeekDto, Club, Court, Player, InvitedPlayer, Movement, PlayerResponseDto]),
    ClubModule,
    CourtModule,
    PlayerModule,
    AuthModule,
  ],
  providers: [WeekService, PlayerService, CombinedGuard, CashService],
  controllers: [WeekController],
})
export class WeekModule {}
