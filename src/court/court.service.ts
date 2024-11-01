import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager, In, LessThan, Not } from 'typeorm';
import { Club } from '../club/club.entity';
import { mapDtoToEntity } from '../decorators/automap';
import { HandleDabaseConstraints } from '../decorators/contraint-handlers';
import { HourGroup } from '../hour/hour-group.entity';
import { Hour } from '../hour/hour.entity';
import { Player } from '../player/player.entity';
import { parseDate } from '../utils/dateUtils';
import { COURT_STATES } from './court.constants';
import { Court } from './court.entity';
import { CourtOperationDto } from './dtos/court-operation.dto';
import { CreateCourtDto } from './dtos/create-court.dto';
import { OpenWeekDtoResponse } from './dtos/open-week-response.dto';
import { OpenWeekDto } from './dtos/open-week.dto';
import { UpdateCourtDto } from './dtos/update-court.dto';
import { InvitedPlayer } from './invited.player.entity';
import { InvitedAnonPlayer } from './invited.anon.player.entity';
import { PlayerService } from 'src/player/player.service';
import { CashService } from 'src/cash/cash.service';
import { CreateMovementDto } from 'src/cash/dtos/create-movement.dto';
import { FilterMovementDto } from 'src/cash/dtos/filter-movement.dto';
import { Movement } from 'src/cash/movement.entity';
import { round } from 'src/utils/numberUtils';

@Injectable()
export class CourtService {
  constructor(
    private playerService: PlayerService,
    private cashService: CashService,
  ) {}

  @HandleDabaseConstraints()
  async create(
    manager: EntityManager,
    createCourtDto: CreateCourtDto,
    myPlayerIdOrEmail: string,
  ): Promise<Court> {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parseDate(createCourtDto.date) < today) {
      throw new HttpException(
        `Fecha ${parseDate(createCourtDto.date).toLocaleDateString('es-ES')} expirada`,
        HttpStatus.BAD_REQUEST,
      );
    }
    let myPlayer: Player;
    if (!myPlayerIdOrEmail) {
      throw new HttpException('Jugador obligatorio', HttpStatus.BAD_REQUEST);
    }
    let myPlayerId: number;
    let myPlayerEmail: string;
    try  {
      myPlayerId = parseInt(myPlayerIdOrEmail);
      myPlayer = await manager.findOne(Player, {
        where: { id: myPlayerId },
      });
    } catch (error) {
      myPlayerEmail = myPlayerIdOrEmail;
      myPlayer = await manager.findOne(Player, {
        where: { email: myPlayerEmail },
      });
    }
    if (!myPlayer) {
      throw new HttpException(
        `El jugador ${myPlayerIdOrEmail} no está validado`,
        HttpStatus.NOT_FOUND,
      );
    }
    const court = mapDtoToEntity(createCourtDto, new Court());
    court.date = parseDate(createCourtDto.date);
    if (!court.club) {
      throw new HttpException('Club obligatorio', HttpStatus.BAD_REQUEST);
    }

    if (createCourtDto.players && createCourtDto.players.length > 0) {
      court.players = await Promise.all(
        createCourtDto.players.map(async (playerId) => {
          let player = await manager.findOne(Player, {
            where: { id: playerId },
          });
          if (!player) {
            throw new HttpException(
              `Jugador ${playerId} no encontrado`,
              HttpStatus.NOT_FOUND,
            );
          }
          return player;
        }),
      );
    }
    let club = await manager.findOne(Club, {
      where: { id: createCourtDto.club },
    });
    if (!club) {
      throw new HttpException(
        `Club ${createCourtDto.club} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!court.name) {
      const courts = await manager.find(Court, {
        where: { date: court.date, club: court.club },
      });
      court.name = `Pista ${courts.length + 1}`;
    }
    if (!court.minPlayers) {
      court.minPlayers = 4;
    }
    if (!court.maxPlayers) {
      court.maxPlayers = 4;
    }
    if (!court.state) {
      court.state = 'opened';
    }
    if (!COURT_STATES.includes(court.state)) {
      throw new HttpException(
        `Estado inválido: ${court.state}. Debe estar en uno de ${COURT_STATES}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let existingCourts = await manager.find(Court, {
      where: {
        date: court.date,
        club: court.club,
        hour: court.hour,
        state: In(['opened', 'closed', 'reserved']),
      },
      relations: ['players'],
    });
    if (existingCourts.length > 0) {
      if (
        existingCourts.some((court) => court.players.length < court.minPlayers)
      ) {
        throw new HttpException(
          `La pista ${existingCourts[0].name} ya existe para ${court.date.toLocaleDateString('es-ES')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      for (let existingCourt of existingCourts) {
        const playerIds = existingCourt.players.map((player) => player.id);
        if (playerIds.includes(myPlayer.id)) {
          throw new HttpException(
            `Ya estás incluido en la pista ${existingCourt.name} para ${court.date.toLocaleDateString('es-ES')}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    if (court.players.length >= court.minPlayers) {
      court.state = 'closed';
    }
    if (court.players.length > court.maxPlayers) {
      throw new HttpException(
        `Demasiados jugadores en la pista. Máximo: ${court.maxPlayers}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hourGroup = await manager.findOne(HourGroup, {
      where: { active: true },
    });
    if (!hourGroup) {
      throw new HttpException('No se encontró horario', HttpStatus.NOT_FOUND);
    }
    const hour = await manager.findOne(Hour, {
      where: {
        groupId: hourGroup.id,
        name: court.hour,
      },
    });

    if (!court.price && hour) court.price = hour.price;
    if (!court.hour) {
      throw new HttpException('Hora obligatoria', HttpStatus.BAD_REQUEST);
    }
    
    let result = await manager.save(Court, court);
    await this.createCashMovement(manager, court, myPlayer.id);
    return result;
  }

  async findAll(manager: EntityManager): Promise<Court[]> {
    return await manager.find(Court, {
      relations: ['club', 'players', 'reservation'],
    });
  }

  async findOne(manager: EntityManager, id: number): Promise<Court> {
    const result = await manager.findOne(Court, {
      where: { id },
      relations: ['club', 'players', 'invitedPlayers', 'anonPlayers', 'reservation'],
    });
    return result;
  }

  @HandleDabaseConstraints()
  async update(
    manager: EntityManager,
    id: number,
    courtDto: UpdateCourtDto,
    sustitute: number,
  ): Promise<Court> {
    const existingCourt = await this.findOne(manager, id);
    if (!existingCourt) {
      throw new HttpException(
        `Pista ${id} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (existingCourt.state != courtDto.state && courtDto.state === 'expired') {
      await this.cashService.removeMovementsByCourtId(manager, id);
      manager.save(Court, { id: id, state: 'expired' });
      return existingCourt;
    }
    
    if (existingCourt.state === 'expired' && !courtDto.state) {
      throw new HttpException(
        `Pista ${id} ya está expirada`,
        HttpStatus.BAD_REQUEST,
      );
    }

    mapDtoToEntity(courtDto, existingCourt);

    let sustitutePlayer;
    if (sustitute) {
      sustitutePlayer = await manager.findOne(Player, {
        where: { id: sustitute },
      });
      if (!sustitutePlayer) {
        throw new HttpException(
          `Sustituto ${sustitute} no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (courtDto.players && courtDto.players.length > 0) {
      existingCourt.players = await Promise.all(
        courtDto.players.map(async (playerId) => {
          let player = await manager.findOne(Player, {
            where: { id: playerId },
          });
          if (!player) {
            throw new HttpException(
              `Jugador ${playerId} no encontrado`,
              HttpStatus.NOT_FOUND,
            );
          }
          return player;
        }),
      );
    }
    if (
      existingCourt.state === 'reserved' &&
      courtDto.players.length < existingCourt.minPlayers &&
      !sustitute
    ) {
      throw new HttpException(
        `La pista ${id} está reservada`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      existingCourt.state === 'reserved' &&
      courtDto.players.length < existingCourt.minPlayers &&
      sustitute
    ) {
      existingCourt.players.push(sustitutePlayer);
      existingCourt.state = 'reserved';
    }

    let club = await manager.findOne(Club, {
      where: { id: courtDto.club },
    });
    if (!club) {
      throw new HttpException(
        `Club ${courtDto.club} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (!courtDto.state) {
      courtDto.state = existingCourt.state;
    }
    if (!COURT_STATES.includes(courtDto.state)) {
      throw new HttpException(
        `Estádo no válido: ${courtDto.state}. Debe ser uno de ${COURT_STATES}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existingCourt.players.length >= existingCourt.minPlayers) {
      existingCourt.state = 'closed';
    }
    if (
      existingCourt.players.length < existingCourt.minPlayers &&
      courtDto.state === 'closed'
    ) {
      existingCourt.state = 'opened';
    }
    if (existingCourt.state === 'reserved') {
      throw new HttpException(`Pista ${id} reservada`, HttpStatus.BAD_REQUEST);
    }
    if (existingCourt.players.length > existingCourt.maxPlayers) {
      throw new HttpException(
        `Demasiados juadores. Máximo de: ${existingCourt.maxPlayers}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existingCourt.reservation) {
      existingCourt.state = 'reserved';
    }
    return manager.save(Court, existingCourt);
  }

  @HandleDabaseConstraints()
  async remove(manager: EntityManager, id: number, force: boolean): Promise<void> {
    const existingCourt = await this.findOne(manager, id);
    if (!existingCourt) {
      throw new HttpException(
        `Pista ${id} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (existingCourt.players.length && !force) {
      let players = existingCourt.players.map((player) => player.name);

      let dateStr = existingCourt.date.toISOString().split('T')[0];
      dateStr = dateStr.split('-').reverse().join('-');
      throw new HttpException(
        `Pista ${existingCourt.name} para ${dateStr} tiene los jugadores ${players}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    await manager.delete(Court, id);
  }

  @HandleDabaseConstraints()
  async openWeek(
    manager: EntityManager,
    openWeekDto: OpenWeekDto,
    myPlayerId: number,
  ): Promise<OpenWeekDtoResponse> {
    manager.transaction
    const myPlayer = await manager.findOne(Player, {
      where: { id: myPlayerId },
    });
    if (!myPlayer) {
      throw new HttpException(
        'El jugador no está validado',
        HttpStatus.NOT_FOUND,
      );
    }
    const hourGroup = await manager.findOne(HourGroup, {
      where: { active: true },
    });
    if (!hourGroup) {
      throw new HttpException('Horario no encontrado', HttpStatus.NOT_FOUND);
    }
    const hour = await manager.findOne(Hour, {
      where: {
        groupId: hourGroup.id,
        name: openWeekDto.hour,
      },
    });
    if (!hour) {
      throw new HttpException('Hora no disponible', HttpStatus.NOT_FOUND);
    }

    let result = new OpenWeekDtoResponse();
    let date = parseDate(openWeekDto.date);
    let dayOfWeek = date.getDay();
    let mondayDate = new Date(date);
    mondayDate.setDate(date.getDate() - ((dayOfWeek + 6) % 7));

    const existingCourts = await manager.find(Court, {
      where: {
        reservation: null,
        date: LessThan(mondayDate),
        state: Not('expired'),
      },
    });
    for (let existingCourt of existingCourts) {
      let updateCourt = new UpdateCourtDto();
      updateCourt.state = 'expired';
      await this.update(manager, existingCourt.id, updateCourt, 0); // this remove cash movements
    }

    // for monday to friday
    for (let i = 0; i < 5; i++) {
      let createCourtDto = new CreateCourtDto();
      createCourtDto.hour = openWeekDto.hour;
      let date = new Date(mondayDate);
      date.setDate(date.getDate() + i);
      createCourtDto.date = new Date(date).toLocaleDateString('es-ES');
      createCourtDto.club = openWeekDto.clubId;
      
      let existingCourt = await manager.findOne(Court, {
        where: { date: parseDate(createCourtDto.date) },
      });
      if (!existingCourt) {
        // Inclusión de los admin y vips
        let lastWeekDate = parseDate(createCourtDto.date);
        lastWeekDate.setDate(lastWeekDate.getDate() - 7);
        let lastWeekCourts = await manager.find(Court, {
          where: {
            date: lastWeekDate,
            hour: createCourtDto.hour,
            club: { id: createCourtDto.club },
          },
          relations: ['players'],
        });
        let lastWeekPlayers = lastWeekCourts
          .map((court) => court.players)
          .flat();
        let vipPlayers = await manager.find(Player, {
          where: [{ role: 'vip' }, { role: 'admin' }],
        });
        vipPlayers = vipPlayers.filter((player) => {
          return lastWeekPlayers.some((lastWeekPlayer) => {
            return player.id == lastWeekPlayer.id;
          });
        });

        let remainingPlayers = createCourtDto.maxPlayers;
        if (createCourtDto.players) {
          remainingPlayers -= createCourtDto.players.length;
        } else {
          createCourtDto.players = [];
        }
        if (vipPlayers.length > remainingPlayers) {
          vipPlayers = vipPlayers.slice(0, remainingPlayers);
        }
        createCourtDto.players = createCourtDto.players.concat(
          vipPlayers.map((player) => player.id),
        );

        await this.create(manager, createCourtDto, myPlayerId.toString());
      }
    }
    result.message = 'Semana abierta';
    return result;
  }

  @HandleDabaseConstraints()
  async setMeIn(
    manager: EntityManager,
    courtId: number,
    courtOperation: CourtOperationDto,
  ): Promise<Court> {    
    let existingCourt = await manager.findOne(Court, {
      where: { 
        id: courtId,
        state: Not('expired'),
      },
      relations: ['club', 'players', 'invitedPlayers', 'anonPlayers', 'reservation'],
    });
    if (!existingCourt) {
      throw new HttpException(
        `Pista ${courtId} no encontrada o expiró`,
        HttpStatus.NOT_FOUND,
      );
    }
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    if (existingCourt.date < today) {
      throw new HttpException(
        `Pista ${existingCourt.date.toLocaleDateString('es-ES') + " " + existingCourt.hour} expirada`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existingCourt.players.length >= existingCourt.maxPlayers) {
      throw new HttpException(
        `Demasiados jugadores. Maximo ${existingCourt.maxPlayers}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    
    let player = await this.playerService.findOneAsResponseDto(manager, courtOperation.playerId);
    if (!player) {
      throw new HttpException(
        `Jugador ${courtOperation.playerId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    let playerEntity = await manager.findOne(Player, {
      where: { id: courtOperation.playerId },
    });
    if (existingCourt.players.some((p) => p.id == courtOperation.playerId)) {
      throw new HttpException(
        `Jugador ${player.name} ${player.surname} ya está en la pista ${existingCourt.name}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    let invitedPlayersCount = 0;
    if (courtOperation.invitedPlayers && courtOperation.invitedPlayers.length > 0) {
      invitedPlayersCount = courtOperation.invitedPlayers.length
      if (courtOperation.invitedPlayers.length > 0) {
        for (let invitedPlayerId of courtOperation.invitedPlayers) {
          let invitedPlayer = await manager.findOne(Player, {
            where: { id: invitedPlayerId },
          });
          if (!invitedPlayer) {
            throw new HttpException(
              `Jugador ${invitedPlayerId} no encontrado`,
              HttpStatus.NOT_FOUND,
            );
          }
          if (existingCourt.players.some((p) => p.id == invitedPlayer.id)) {
            throw new HttpException(
              `Jugador ${invitedPlayer.name} ${invitedPlayer.surname} ya está en la pista ${existingCourt.name}`,
              HttpStatus.BAD_REQUEST,
            );
          }
          if (existingCourt.invitedPlayers && existingCourt.invitedPlayers.length > 0) {
            for (let existingInvitedId of existingCourt.invitedPlayers) {
              const existingInvitedEntity = await manager.findOne(InvitedPlayer, {
                where: { id: existingInvitedId.id },
                relations: ['invitedPlayer'],
              });
              if (existingInvitedEntity.invitedPlayer.id === invitedPlayer.id) {
                throw new HttpException(
                  `Jugador ${invitedPlayer.name} ${invitedPlayer.surname} ya está invitado a la pista ${existingCourt.name}`,
                  HttpStatus.BAD_REQUEST,
                );
              }
            }
          }
          
          let invitedPlayerEntity = new InvitedPlayer();
          invitedPlayerEntity.invitedPlayer = invitedPlayer;
          invitedPlayerEntity.payerPlayer = playerEntity;
          invitedPlayerEntity.court = existingCourt;
          await manager.save(InvitedPlayer, invitedPlayerEntity);
          await this.createCashMovementFromInvited(manager, existingCourt, player.id, 'Invitando a ' + invitedPlayer.name + ' ' + invitedPlayer.surname);
        }          
      }
    }
    let anonPlayersCount = 0;
    if (courtOperation.anonPlayers && courtOperation.anonPlayers.length > 0) {
      anonPlayersCount = courtOperation.anonPlayers.length;
      let anonPlayers = courtOperation.anonPlayers
      for (let anonPlayer of anonPlayers) {
        let invitedAnonPlayer = new InvitedAnonPlayer();
        invitedAnonPlayer.nameAnonPlayer = anonPlayer;
        invitedAnonPlayer.payerPlayer = playerEntity;
        invitedAnonPlayer.court = existingCourt;
        await manager.save(invitedAnonPlayer);
        await this.createCashMovementFromInvited(manager, existingCourt, player.id, 'Invitando a ' + anonPlayer);
      }
    }
    const totalPlayersToPay = invitedPlayersCount + anonPlayersCount + 1;
    const totalCost = totalPlayersToPay * existingCourt.price;
    if ((player.futureBalance - totalCost) < 0) {
      throw new HttpException(
        `Saldo futuro ${round(player.futureBalance - totalCost)} insuficiente. Reservas semana: ${round(player.balance - player.futureBalance)}. Pistas añadidas: ${totalCost}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let totalPlayers = existingCourt.players.length + totalPlayersToPay;
    if (existingCourt.invitedPlayers) totalPlayers += existingCourt.invitedPlayers.length;
    if (existingCourt.anonPlayers) totalPlayers += existingCourt.anonPlayers.length;
    if (totalPlayers > existingCourt.maxPlayers) {
      throw new HttpException(
        `Demasiados jugadores. Maximo: ${existingCourt.maxPlayers}. Jugadores: ${totalPlayers}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    existingCourt = await manager.findOne(Court, {
      where: { id: courtId },
      relations: ['club', 'players', 'invitedPlayers', 'anonPlayers', 'reservation'],
    });
    await existingCourt.players.push(playerEntity);
    if (totalPlayers >= existingCourt.minPlayers) {
      existingCourt.state = 'closed';
    }
    await manager.save(Court, existingCourt);
    await this.createCashMovement(manager, existingCourt, player.id);
    return existingCourt;
  }

  private async createCashMovement(manager: EntityManager, existingCourt: Court, playerId: number, message?: string) {
    if (!existingCourt.players.some((p) => p.id == playerId)) {
      return;
    }
    let movementDto: CreateMovementDto = new CreateMovementDto();
    movementDto.amount = -1 * existingCourt.price;
    movementDto.playerId = playerId;
    movementDto.courtId = existingCourt.id;
    if (message) movementDto.name = message;
    await this.cashService.create(manager, movementDto);
    let existingPlayer = await this.playerService.findOneAsResponseDto(manager, playerId);
    if (existingPlayer.futureBalance < 0 ) {
      throw new HttpException(
        `Saldo futuro ${existingPlayer.futureBalance} insuficiente. Previsto: ${round(existingPlayer.balance - existingPlayer.futureBalance)}. Pistas añadidas: ${existingCourt.price}.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async createCashMovementFromInvited(manager: EntityManager, existingCourt: Court, playerId: number, message?: string) {
    let movementDto: CreateMovementDto = new CreateMovementDto();
    movementDto.amount = -1 * existingCourt.price;
    movementDto.playerId = playerId;
    movementDto.courtId = existingCourt.id;
    if (message) movementDto.name = message;
    await this.cashService.create(manager, movementDto);
    let existingPlayer = await this.playerService.findOneAsResponseDto(manager, playerId);
    if (existingPlayer.futureBalance < 0 ) {
      throw new HttpException(
        `Saldo futuro ${existingPlayer.futureBalance} insuficiente. Previsto: ${round(existingPlayer.balance - existingPlayer.futureBalance)}. Pistas añadidas: ${existingCourt.price}.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @HandleDabaseConstraints()
  async setMeOut(
    manager: EntityManager,
    courtId: number,
    courtOperation: CourtOperationDto,
  ): Promise<Court> {    
    let existingCourt = await manager.findOne(Court, {
      where: { 
        id: courtId,
      },
      relations: ['club', 'players', 'invitedPlayers', 'anonPlayers', 'reservation'],
    });
    if (!existingCourt) {
      throw new HttpException(
        `Pista ${courtId} no encontrada`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (existingCourt.state === 'reserved' && !courtOperation.toPlayerId) {
      throw new HttpException(
        `Pista ${courtId} reservada`,
        HttpStatus.BAD_REQUEST,
      );
    }
    let allMyPlayersCount = 1;
    if (existingCourt.invitedPlayers && existingCourt.invitedPlayers.length > 0) {
      for (let invitedPlayer of existingCourt.invitedPlayers) {
        const existingInvitedEntity = await manager.findOne(InvitedPlayer, {
          where: { id: invitedPlayer.id },
          relations: ['payerPlayer'],
        });
        if (existingInvitedEntity.payerPlayer.id === courtOperation.playerId) {
          await manager.delete(InvitedPlayer, invitedPlayer.id);
          allMyPlayersCount += 1;
        }
      }
    }
    if (existingCourt.anonPlayers && existingCourt.anonPlayers.length > 0) {
      for (let anonPlayer of existingCourt.anonPlayers) {
        const existingInvitedAnonEntity = await manager.findOne(InvitedAnonPlayer, {
          where: { id: anonPlayer.id },
          relations: ['payerPlayer'],
        });
        if (existingInvitedAnonEntity.payerPlayer.id === courtOperation.playerId) {
          await manager.delete(InvitedAnonPlayer, anonPlayer.id);
          allMyPlayersCount += 1;
        }
      }
    }
    let player = await manager.findOne(Player, {
      where: { id: courtOperation.playerId },
    });
    if (!player) {
      throw new HttpException(
        `Jugador ${courtOperation.playerId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    let toPlayer = await manager.findOne(Player, {
      where: { id: courtOperation.toPlayerId },
    });
    if (!toPlayer) {
      throw new HttpException(
        `Sustituto ${courtOperation.toPlayerId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    let payerPlayerInvitedPlayerId = 0;
    if (!existingCourt.players.some((p) => p.id == courtOperation.playerId)) {
      const invitedPlayers = await manager.find(InvitedPlayer, {
        where: { 
          court: existingCourt,
          invitedPlayer: { id: courtOperation.playerId },
        },
        relations: ['payerPlayer', 'invitedPlayer'],
      });
      if (!invitedPlayers)
        throw new HttpException(
          `Jugador ${player.name} ${player.surname} no está en la pista ${existingCourt.name}`,
          HttpStatus.NOT_FOUND,
        );
      else {
        payerPlayerInvitedPlayerId = invitedPlayers[0].payerPlayer.id;
        await manager.delete(InvitedPlayer, invitedPlayers[0].id);          
      }
    }
    existingCourt.players = existingCourt.players.filter(
      (player) => player.id !== courtOperation.playerId,
    );
    if (courtOperation.toPlayerId) {
      existingCourt.players.push(toPlayer);
    }
    if (existingCourt.players.length < existingCourt.minPlayers && existingCourt.state === 'closed') {
      existingCourt.state = 'opened';
    }
    const result = await manager.save(existingCourt);

    if (!payerPlayerInvitedPlayerId) {
      const totalCost = allMyPlayersCount * existingCourt.price;
      await manager.save(player);
    } else {
      let payerPlayer = await manager.findOne(Player, {
        where: { id: payerPlayerInvitedPlayerId },
        });
      await manager.save(Player, payerPlayer);
    }
    const filterCashMovement: FilterMovementDto = new FilterMovementDto();
    filterCashMovement.courtId = existingCourt.id;
    filterCashMovement.playerId = player.id;
    const movements = await this.cashService.findCashMovements(manager, filterCashMovement);
    if (movements.items.length > 0) {
      for (let movement of movements.items) {
        await manager.delete(Movement, movement.id);
      }
    }
    existingCourt = await manager.findOne(Court, {
      where: { 
        id: courtId,
      },
      relations: ['players', 'invitedPlayers', 'anonPlayers'],
    });
    return result;
    
  }

  async courtWithoutReservation(manager: EntityManager): Promise<Court[]> {
    return await manager.find(Court, {
      where: {
        reservation: null,
        state: 'closed',
      },
      relations: ['club', 'players', 'invitedPlayers', 'anonPlayers', 'reservation'],
    });
  }
}
