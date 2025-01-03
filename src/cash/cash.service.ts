import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { PlayerService } from 'src/player/player.service';
import { round } from 'src/utils/numberUtils';
import { Between, EntityManager, IsNull, Not } from 'typeorm';
import { Court } from '../court/court.entity';
import { Player } from '../player/player.entity';
import { parseDate } from '../utils/dateUtils';
import { CreateMonthlyCostDto } from './dtos/create-monthly-cost.dto';
import { CreateMovementDto } from './dtos/create-movement.dto';
import { FilterAllMovementDto } from './dtos/filter-all-movement.dto';
import { FilterMovementDto } from './dtos/filter-movement.dto';
import { PaginatedMovements } from './dtos/paginated-cash.dto';
import { UpdateMovementDto } from './dtos/update-movement.dto';
import { MonthlyCost } from './monthly.cost.entity';
import { Movement } from './movement.entity';

@Injectable()
export class CashService {
  constructor(private playerService: PlayerService) {}

  async create(manager, info: CreateMovementDto): Promise<Movement> {
    const payerPlayer = await this.playerService.findOne(
      manager,
      info.playerId,
    );
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
      if (info.validated && !info.unchangeBalance) {
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
    if (info.monthlyCostId) {
      const monthlyCost = await manager.findOne(MonthlyCost, {
        where: { id: info.monthlyCostId },
      });
      if (!monthlyCost) {
        throw new HttpException(
          `No se encontró el coste mensual ${info.monthlyCostId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      movement.monthlyCost = monthlyCost;
      movement.name =
        info.name ?? `Coste mensual ${monthlyCost.month}/${monthlyCost.year}`;
    }
    movement.setDefaults();
    return await manager.save(Movement, movement);
  }

  async createMonthlyCost(
    manager,
    info: CreateMonthlyCostDto,
  ): Promise<Movement> {
    const monthlyCost = await manager.findOne(MonthlyCost, {
      where: { year: info.year, month: info.month },
    });
    if (monthlyCost) {
      throw new HttpException(
        `Los costes mensuales para ${info.month}/${info.year} ya existen`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const lastDayOfMonth = new Date(info.year, info.month, 0);
    const courts = await manager.find(Court, {
      where: {
        date: Between(new Date(info.year, info.month - 1, 1), lastDayOfMonth),
        reservation: Not(IsNull()),
      },
      relations: ['players'],
    });

    class CourtsByPlayers {
      playerId: number;
      count: number;
    }
    let allPlayers: CourtsByPlayers[] = [];

    courts.forEach((court) => {
      court.players.forEach((player) => {
        let playerIndex = allPlayers.findIndex((p) => p.playerId === player.id);
        if (playerIndex === -1) {
          allPlayers.push({ playerId: player.id, count: 1 });
        } else {
          allPlayers[playerIndex].count++;
        }
      });
    });
    const totalPlayers = allPlayers.reduce(
      (acc, player) => acc + player.count,
      0,
    );
    const maintenanceIncome = round(totalPlayers * 0.2);
    const maintenanceCost = round(info.amount - maintenanceIncome);

    const monthlyCostEntity = new MonthlyCost();
    monthlyCostEntity.amount = info.amount;
    monthlyCostEntity.month = info.month;
    monthlyCostEntity.year = info.year;

    monthlyCostEntity.description =
      `Coste general: ${maintenanceIncome}\n` +
      `Coste restante: ${maintenanceCost}\n` +
      `Jugadores: ${totalPlayers}\n`;

    let result = await manager.save(MonthlyCost, monthlyCostEntity);
    if (maintenanceCost < 0) {
      result = await manager.save(MonthlyCost, {
        ...monthlyCostEntity,
        description: monthlyCostEntity.description + 'Movimientos no creados',
      });
      return result;
    }
    allPlayers.forEach(async (player) => {
      const maintenanceByPlayer = round(
        (player.count / totalPlayers) * maintenanceCost,
      );
      await this.create(manager, {
        amount: -1 * maintenanceByPlayer,
        playerId: player.playerId,
        name: `Coste mensual ${info.month}/${info.year}. Jugadas ${player.count}/Total jugadores ${totalPlayers}. Coste ${maintenanceByPlayer}`,
        validated: true,
        monthlyCostId: result.id,
      });
    });
    return result;
  }

  async findMonthlyCost(manager: EntityManager): Promise<MonthlyCost[]> {
    return manager.find(MonthlyCost);
  }

  async findCashMovements(
    manager: EntityManager,
    filter: FilterMovementDto,
  ): Promise<PaginatedMovements> {
    const myPlayer = await this.playerService.findOneAsResponseDto(
      manager,
      filter.playerId,
    );
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
      date: movement.court
        ? movement.court.date.toISOString().split(' ')[0] + movement.court.hour
        : movement.date.toISOString(),
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
    result.totalCount = await manager.count(Movement, {
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
      date: movement.court
        ? movement.court.date.toISOString().split('T')[0] +
          ' ' +
          movement.court.hour
        : movement.date.toISOString(),
    }));
    return result;
  }

  async removeMovementsByCourtId(
    manager: EntityManager,
    courtId: number,
  ): Promise<void> {
    const existingMovements = await manager.find(Movement, {
      where: {
        court: {
          id: courtId,
        },
        validated: false,
      },
    });
    await manager.findOne(Court, {
      where: { id: courtId },
      relations: ['invitedPlayers', 'anonPlayers'],
    });
    for (let i = 0; i < existingMovements.length; i++) {
      await this.remove(manager, existingMovements[i].id, true);
    }
  }

  async remove(
    manager: EntityManager,
    id: number,
    force: boolean = false,
  ): Promise<void> {
    const existingMovement = await manager.findOne(Movement, {
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

  async update(
    manager: EntityManager,
    id: number,
    info: UpdateMovementDto,
  ): Promise<Movement> {
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
      let playerEntity = await this.playerService.findOne(
        manager,
        movement.player.id,
      );
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

  async removeMonthlyCost(
    manager: EntityManager,
    monthlyCostId: number,
  ): Promise<void> {
    const monthlyCost = await manager.findOne(MonthlyCost, {
      where: { id: monthlyCostId },
      relations: ['movements'],
    });
    if (!monthlyCost) {
      throw new HttpException(
        `No se encontró el coste mensual ${monthlyCostId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (monthlyCost.movements && monthlyCost.movements.length > 0) {
      for (const movement of monthlyCost.movements) {
        await this.update(manager, movement.id, { validated: false });
        await this.remove(manager, movement.id);
      }
    }
    await manager.delete(MonthlyCost, monthlyCostId);
  }
}
