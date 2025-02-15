import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Court } from '../court/court.entity';
import { CourtModule } from '../court/court.module';
import { ReservationController } from './reservation.controller';
import { Reservation } from './reservation.entity';
import { ReservationService } from './reservation.service';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { CashService } from '../cash/cash.service';
import { Movement } from '../cash/movement.entity';
import { PlayerService } from '../player/player.service';
import { PlayerResponseDto } from '../player/dtos/player.response.dto';
import { ClubResponseDto } from '../club/dtos/club.response.dto';
import { Club } from '../club/club.entity';
import { ClubModule } from '../club/club.module';
import { ClubService } from '../club/club.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservation,
      Court,
      Player,
      Movement,
      Player,
      PlayerResponseDto,
      ClubResponseDto,
      Club,
    ]),
    CourtModule,
    PlayerModule,
    ClubModule,
  ],
  providers: [ReservationService, CashService, PlayerService, ClubService],
  controllers: [ReservationController],
})
export class ReservationModule {}
