import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { Between, EntityManager } from 'typeorm';
import { Court } from '../court/court.entity';
import { Player } from '../player/player.entity';
import { parseDate } from '../utils/dateUtils';
import { FilterAllMovementDto } from './dtos/filter-all-movement.dto';
import { FilterMovementDto } from './dtos/filter-movement.dto';
import { PaginatedMovements } from './dtos/paginated-cash.dto';
import { UpdateMovementDto } from './dtos/update-movement.dto';
import { Movement } from './movement.entity';
import { CreateMovementDto } from './dtos/create-movement.dto';
import { PlayerService } from 'src/player/player.service';
import { round } from 'src/utils/numberUtils';

@Injectable()
export class CashService {
  constructor(
    private playerService: PlayerService,    

  ) {}

  async create(manager, info: CreateMovementDto): Promise<Movement> {    
    const payerPlayer = await this.playerService.findOne(manager, info.playerId);
    if (!payerPlayer) {
      throw new HttpException(
        `No se encontró el jugador ${info.playerId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const movement = new Movement();
    movement.amount = info.amount;
    movement.date = new Date();
    if (info.name) {
      movement.name = info.name;
    } else {
      movement.name = info.amount < 0 ? 'Salida efectivo' : 'Recarga de saldo';
    }
    movement.player = payerPlayer;
    if (info.validated !== undefined) {
      movement.validated = info.validated;
      if (info.validated) {
        payerPlayer.balance += info.amount;
        payerPlayer.balance = round(payerPlayer.balance);
        await manager.save(Player, payerPlayer);
      }
    } else {
      movement.validated = false;
    }
    if (info.courtId) {
      const court = await manager.findOne(Court, {
        where: { id: info.courtId },
      });
      if (!court) {
        throw new HttpException(
          `No se encontró la pista ${info.courtId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      movement.court = court;
      movement.name = info.name ?? `Pago ${court.name}`;
    }
    movement.setDefaults();
    return await manager.save(Movement, movement);
  }


  async findCashMovements(
    manager: EntityManager,
    filter: FilterMovementDto,
  ): Promise<PaginatedMovements> {    
    const myPlayer = await this.playerService.findOneAsResponseDto(manager, filter.playerId);
    if (!myPlayer) {
      throw new HttpException(
        `No se encontró el jugador ${filter.playerId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    let result: PaginatedMovements = new PaginatedMovements();
    result.balance = round(myPlayer.balance);
    result.futureBalance = round(myPlayer.futureBalance);
    result.page = filter.page || 0;
    result.pageSize = filter.pageSize || 10;
    result.totalCount = await manager.count(Movement, {
      where: { player: { id: filter.playerId } },
    });

    let typeOrmFilter: any = { player: { id: filter.playerId } };
    typeOrmFilter.date = this.applyDateFilter(filter);
    if (filter.courtId) {
      typeOrmFilter.court = { id: filter.courtId };
    }

    var movements = await manager.find(Movement, {
      where: typeOrmFilter,
      order: { date: 'DESC' },
      take: result.pageSize,
      skip: result.page * result.pageSize,
      relations: ['court'],
    });
    result.items = movements.map((movement) => ({
      ...movement,
      date: movement.court ? movement.court.date.toISOString().split(' ')[0] + movement.court.hour : movement.date.toISOString(),
    }));
    return result;
  }

  private applyDateFilter(filter: FilterMovementDto | FilterAllMovementDto) {
    let dateFromFilter = parseDate(filter.dateFrom);
    if (!filter.dateFrom) {
      dateFromFilter = new Date();
      dateFromFilter.setMonth(dateFromFilter.getMonth() - 1);
    }
    let dateToFilter = parseDate(filter.dateTo);
    const formattedDateFrom = format(dateFromFilter, 'yyyy-MM-dd 00:00:00');
    const formattedDateTo = format(dateToFilter, 'yyyy-MM-dd 23:59:59');

    return Between(formattedDateFrom, formattedDateTo);
  }

  async findAllCashMovements(
    manager: EntityManager,
    filter: FilterAllMovementDto,
  ): Promise<PaginatedMovements> {
    let result: PaginatedMovements = new PaginatedMovements();
    result.page = filter.page || 0;
    result.pageSize = filter.pageSize || 10;
    let typeOrmFilter: any = {};
    typeOrmFilter.date = this.applyDateFilter(filter);
    result.totalCount = await manager.count(Movement,{
      where: typeOrmFilter,
    });
    var movements = await manager.find(Movement, {
      where: typeOrmFilter,
      order: { validated: 'ASC', amount: 'DESC', date: 'DESC' },
      take: result.pageSize,
      skip: result.page * result.pageSize,
      relations: ['player', 'court'],
    });
    result.items = movements.map((movement) => ({
      ...movement,
      date: movement.court ? movement.court.date.toISOString().split('T')[0] + " " + movement.court.hour : movement.date.toISOString(),
    }));
    return result;
  }

  async removeMovementsByCourtId(
    manager: EntityManager,
    courtId: number
  ): Promise<void> {
    const existingMovements = await manager.find(Movement, {
      where: { court: { id: courtId } },
    });
    const existingCourt = await manager.findOne(Court, {
      where: { id: courtId },
      relations: ['invitedPlayers', 'anonPlayers'],
    });
    for (let i = 0; i < existingMovements.length; i++) {
      await this.remove(
        manager, existingMovements[i].id, true
      );
    }
  }

  async remove(manager: EntityManager, id: number, force: boolean = false): Promise<void> {
    const existingMovement = await manager.findOne(Movement,{
      where: { id: id },
      relations: ['player'],
    });
    if (!existingMovement) {
      throw new HttpException(
        `No se encontró el movimiento ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (existingMovement.validated && !force) {
      throw new HttpException(
        `El movimiento ${existingMovement.id} está validado. Anulalo y vuelve a intentar.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existingMovement.player) {
      const player = await manager.findOne(Player, {
        where: { id: existingMovement.player.id },
      });
      if (player) {
        await manager.save(Player, player);
      }
    }
    await manager.delete(Movement, id);
  }

  async update(manager: EntityManager, id: number, info: UpdateMovementDto): Promise<Movement> {    
    let movement = await manager.findOne(Movement, {
      where: { id: id },
      relations: ['player'],
    });
    if (!movement) {
      throw new HttpException(
        `No se encontró el movimiento ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    let balanceDiff = 0;
    if (movement.validated !== info.validated) {
      if (info.validated) {
        balanceDiff = movement.amount;
      } else {
        balanceDiff = -1 * movement.amount;
      }
    }
    balanceDiff = round(balanceDiff);
    if (movement.player) {
      let playerEntity = await this.playerService.findOne(manager, movement.player.id);
      if (!playerEntity) {
        throw new HttpException(
          `No se encontró el jugador ${movement.player.id}`,
          HttpStatus.NOT_FOUND,
        );
      }
      playerEntity.balance += balanceDiff;
      playerEntity.balance = round(playerEntity.balance);
      await manager.save(Player, playerEntity);
    }
    movement.validated = info.validated;
    return await manager.save(Movement, movement);
  }
}
