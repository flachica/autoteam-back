import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Court } from '../court/court.entity';
import { HandleDabaseConstraints } from '../decorators/contraint-handlers';
import { Player } from '../player/player.entity';
import { CourtDto } from './dtos/court.dto';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationDto } from './dtos/reservation.dto';
import { Reservation } from './reservation.entity';
import { CashService } from 'src/cash/cash.service';
import { FilterMovementDto } from 'src/cash/dtos/filter-movement.dto';
import { UpdateMovementDto } from 'src/cash/dtos/update-movement.dto';

@Injectable()
export class ReservationService {
  constructor(
    private readonly cashService: CashService,
  ) {}

  @HandleDabaseConstraints()
  async create(
    manager: EntityManager,
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationDto> {
    let result: ReservationDto;
    const player = await manager.findOne(Player, {
      where: { id: createReservationDto.playerId },
    });
    if (!player) {
      throw new HttpException(
        `Jugador ${createReservationDto.playerId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (player.role !== 'admin') {
      throw new HttpException(
        `Jugador ${createReservationDto.playerId} no es admin`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    
    let existingCourt: Court;
    if (createReservationDto.courtId) {
      existingCourt = await manager.findOne(Court, {
        where: { id: createReservationDto.courtId },
        relations: ['reservation', 'invitedPlayers', 'anonPlayers', 'players'],
      });
      if (!existingCourt) {
        throw new HttpException(
          `Pista ${createReservationDto.courtId} no encontrada`,
          HttpStatus.NOT_FOUND,
        );
      }
      if (existingCourt.reservation) {
        throw new HttpException(
          `La pista ${createReservationDto.courtId} tiene la reserva ${existingCourt.reservation.id}`,
          HttpStatus.CONFLICT,
        );
      }
      if (existingCourt.state !== 'closed') {
        throw new HttpException(
          `Pista ${createReservationDto.courtId} no cerrada. Tiene el estado ${existingCourt.state} con la reserva ${existingCourt.reservation}`,
          HttpStatus.CONFLICT,
        );
      }
      await manager.save(Court, existingCourt);
      let reservation = new Reservation();
      reservation.court = existingCourt;        
      const saveResult = await manager.save(Reservation, reservation);

      result = new ReservationDto();
      result.id = saveResult.id;
      result.courtId = existingCourt.id;
      existingCourt.state = 'reserved';
      if (createReservationDto.name) {
        existingCourt.name = createReservationDto.name;
      }
      existingCourt.reservation = saveResult;
      await manager.save(Court, existingCourt);
      for (let payerPlayer of existingCourt.players) {
        let filterMovement = new FilterMovementDto();
        filterMovement.playerId = payerPlayer.id;
        filterMovement.courtId = existingCourt.id;
        const paginatedMovements = await this.cashService.findCashMovements(manager, filterMovement);
        for (let movement of paginatedMovements.items) {
          let updateDto = new UpdateMovementDto();
          updateDto.validated = true;
          await this.cashService.update(manager, movement.id, updateDto);
        }
      }
      
    }
    return result;
  }

  async findAll(manager: EntityManager): Promise<ReservationDto[]> {
    const reservations = await manager.find(Reservation,{
      relations: ['court'],
    });
    return reservations.map((reservation) => {
      const courtDto = new CourtDto();
      if (reservation.court) {
        courtDto.id = reservation.court.id;
        courtDto.date = reservation.court.date;
        courtDto.state = reservation.court.state;
      }

      const reservationDto = new ReservationDto();
      reservationDto.id = reservation.id;
      reservationDto.courtId = courtDto.id;

      return reservationDto;
    });
  }

  async findOne(manager: EntityManager, id: number): Promise<ReservationDto> {
    const reservation = await manager.findOne(Reservation, {
      where: { id },
      relations: ['court'],
    });

    if (!reservation) {
      throw new HttpException(
        `Reserva ${id} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    const courtDto = new CourtDto();
    courtDto.id = reservation.court.id;
    courtDto.date = reservation.court.date;
    courtDto.state = reservation.court.state;

    const reservationDto = new ReservationDto();
    reservationDto.id = reservation.id;
    reservationDto.courtId = courtDto.id;

    return reservationDto;
  }

  @HandleDabaseConstraints()
  async remove(
    manager: EntityManager,
    id: number,
    createReservationDto: CreateReservationDto,
  ): Promise<void> {
    const player = await manager.findOne(Player, {
      where: { id: createReservationDto.playerId },
    });
    if (!player) {
      throw new HttpException(
        `Jugador ${createReservationDto.playerId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (player.role !== 'admin') {
      throw new HttpException(
        `Jugador ${createReservationDto.playerId} no es admin`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const court = await manager.findOne(Court, {
      where: { id: createReservationDto.courtId },
      relations: ['reservation'],
    });

    if (!court) {
      throw new HttpException(
        `Pista ${createReservationDto.courtId} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    let existingReservation = await manager.findOne(Reservation, {
      where: { id: court.reservation.id },
      relations: ['court'],
    });

    if (!existingReservation) {
      throw new HttpException(
        `Reserva ${id} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    let existingCourt = await manager.findOne(Court, {
      where: { id: existingReservation.court.id },
      relations: ['players'],
    });
    if (existingCourt) {
      existingCourt.state = 'closed';
      existingCourt.reservation = null;
      await manager.save(Court, existingCourt);
    }
    for (let payerPlayer of existingCourt.players) {
      let filterMovement = new FilterMovementDto();
      filterMovement.playerId = payerPlayer.id;
      filterMovement.courtId = existingCourt.id;
      const paginatedMovements = await this.cashService.findCashMovements(manager, filterMovement);
      for (let movement of paginatedMovements.items) {
        let updateDto = new UpdateMovementDto();
        updateDto.validated = false;
        await this.cashService.update(manager, movement.id, updateDto);
      }
    }
    await manager.delete(Reservation, id);
  }
}
