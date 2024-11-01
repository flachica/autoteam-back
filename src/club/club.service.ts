import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { HandleDabaseConstraints } from '../decorators/contraint-handlers';
import { Player } from '../player/player.entity';
import { Club } from './club.entity';
import { CreateClubDto } from './dtos/create-club.dto';

@Injectable()
export class ClubService {
  constructor() {}

  @HandleDabaseConstraints()
  async create(manager: EntityManager, createClubDto: CreateClubDto): Promise<Club> {
    const { name, players } = createClubDto;

    const club = new Club();
    club.name = name;

    if (players && players.length > 0) {
      club.players = await Promise.all(
        players.map(async (playerId) => {
          const player = await manager.findOne(Player, {
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

    return await manager.save(Club, club);
  }

  async findAll(manager: EntityManager, ): Promise<Club[]> {
    return await manager.find(Club, { relations: ['players'] });
  }

  async findOne(manager: EntityManager, id: number): Promise<Club> {
    return await manager.findOne(Club, {
      where: { id },
      relations: ['players'],
    });
  }

  @HandleDabaseConstraints()
  async update(manager: EntityManager, id: number, updateClubDto: CreateClubDto): Promise<Club> {
    const { name, players } = updateClubDto;

    const club = await this.findOne(manager, id);
    if (!club) {
      throw new HttpException('Club no encontrado', HttpStatus.NOT_FOUND);
    }

    club.name = name;

    if (players && players.length > 0) {
      club.players = await Promise.all(
        players.map(async (playerId) => {
          const player = await manager.findOne(Player, {
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

    await manager.save(Club, club);
    return await this.findOne(manager, id);
  }

  async remove(manager: EntityManager, id: number): Promise<void> {
    const club = await this.findOne(manager, id);
    if (!club) {
      throw new HttpException('Club no encontrado', HttpStatus.NOT_FOUND);
    }

    // Desvincular jugadores del club
    club.players = [];
    await manager.save(Club, club);
    await manager.delete(Club, id);
  }
}
