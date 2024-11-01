import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from '../court/court.entity';
import { CourtModule } from '../court/court.module';
import { ReservationController } from './reservation.controller';
import { Reservation } from './reservation.entity';
import { ReservationService } from './reservation.service';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { CashService } from 'src/cash/cash.service';
import { Movement } from 'src/cash/movement.entity';
import { PlayerService } from 'src/player/player.service';
import { PlayerResponseDto } from 'src/player/dtos/player.response.dto';
import { ClubResponseDto } from 'src/club/dtos/club.response.dto';
import { Club } from 'src/club/club.entity';
import { ClubModule } from 'src/club/club.module';
import { ClubService } from 'src/club/club.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Court, Player, Movement, Player, PlayerResponseDto, ClubResponseDto, Club]),
    CourtModule,
    PlayerModule,
    ClubModule,
  ],
  providers: [ReservationService, CashService, PlayerService, ClubService],
  controllers: [ReservationController],
})
export class ReservationModule {}
