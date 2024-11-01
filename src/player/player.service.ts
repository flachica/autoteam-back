import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { EntityManager } from 'typeorm';
import { Club } from '../club/club.entity';
import { mapDtoToEntity } from '../decorators/automap';
import { HandleDabaseConstraints } from '../decorators/contraint-handlers';
import { AuthenticateInfoDto } from './dtos/authenticate.dto';
import { AuthenticateGoogleDto } from './dtos/authenticate.google.dto';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerFrontDto } from './dtos/update-player-front.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { PLAYER_ROLES } from './player.constants';
import { Player } from './player.entity';
import { PlayerResponseDto } from './dtos/player.response.dto';
import { Movement } from 'src/cash/movement.entity';
import { MovementResponseDto } from 'src/cash/dtos/movement.response.dto';
import { round } from 'src/utils/numberUtils';

@Injectable()
export class PlayerService {
  constructor() {}

  @HandleDabaseConstraints()
  async create(manager: EntityManager, createPlayerDto: CreatePlayerDto): Promise<Player> {
    const player = mapDtoToEntity(createPlayerDto, new Player());
    const clubList = await manager.find(Club);

    let existingPlayer: Player;
    if (player.email) {
      existingPlayer = await manager.findOne(Player, {
        where: { email: player.email },
      });
      if (existingPlayer) {
        throw new HttpException(
          `Ya existe un jugador con el email ${player.email}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    existingPlayer = await manager.findOne(Player, {
      where: { phone: player.phone },
    });
    if (existingPlayer) {
      throw new HttpException(
        `Ya existe un jugador con el teléfono ${player.phone}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!player.role) {
      player.role = 'player';
    }
    if (!PLAYER_ROLES.includes(player.role)) {
      throw new HttpException(
        `El rol no es válido: ${player.role}. Debe ser uno de ${PLAYER_ROLES}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashedPassword = await bcrypt.hash(player.password, 10);
    player.password = hashedPassword;
    if (player.email) {
      player.email = player.email.toLowerCase();
      player.email = player.email.trim();
    }
    player.clubs = clubList;
    return await manager.save(Player, player);
  }

  async findAll(manager: EntityManager): Promise<PlayerResponseDto[]> {
    const players: Player[] = await manager.find(Player, {
      relations: ['clubs'],
      order: { name: 'ASC', surname: 'ASC' },
    });
    let result: PlayerResponseDto[] = [];
    for (let player of players) {
      result.push(await this.fromPlayerToResponse(manager, player));
    }
    return result;
  }

  private async fromPlayerToResponse(manager: EntityManager, player: Player): Promise<PlayerResponseDto> {
    const draftMovements: Movement[] = await manager.find(Movement, {
      where: {
        validated: false,
        player: { id: player.id },
      },
    });
    let draftMovementResponse: MovementResponseDto[] = [];
    for (let movement of draftMovements) {
      draftMovementResponse.push({
        id: movement.id,
        date: movement.date,
        name: movement.name,
        courtId: movement.court ? movement.court.id : null,
        amount: movement.amount,
        validated: movement.validated,
      });
    }
    return {
      id: player.id,
      name: player.name,
      surname: player.surname,
      phone: player.phone,
      email: player.email,
      role: player.role,
      clubIds: player.clubs.map(club => club.id),
      password: player.password,
      draftMovements: draftMovementResponse,
      balance: player.balance,
      futureBalance: round(player.balance + draftMovements.reduce((acc, movement) => acc + movement.amount, 0)),
    };
  }

  async findOne(manager: EntityManager, id: number): Promise<Player> {
    return await manager.findOne(Player, {
      where: { id },
      relations: ['clubs'],
    });
  }

  async findOneAsResponseDto(manager: EntityManager, id: number): Promise<PlayerResponseDto> {
    const player = await this.findOne(manager, id);
    return await this.fromPlayerToResponse(manager, player);
  }

  @HandleDabaseConstraints()
  async update(manager: EntityManager, id: number, playerDto: UpdatePlayerDto): Promise<Player> {
    const existingPlayer = await manager.findOne(Player, {
      where: { id },
      relations: ['clubs'],
    });
    if (!existingPlayer) {
      throw new HttpException('Jugador no encontrado', HttpStatus.NOT_FOUND);
    }

    mapDtoToEntity(playerDto, existingPlayer);

    if (playerDto.clubs && playerDto.clubs.length > 0) {
      existingPlayer.clubs = await Promise.all(
        playerDto.clubs.map(async (clubId) => {
          let club = await manager.findOne(Club, {
            where: { id: clubId },
          });
          if (!club) {
            throw new HttpException(
              `Club ${clubId} no encontrado`,
              HttpStatus.NOT_FOUND,
            );
          }
          return club;
        }),
      );
    }
    if (!playerDto.role) {
      playerDto.role = existingPlayer.role;
    }
    if (!PLAYER_ROLES.includes(playerDto.role)) {
      throw new HttpException(
        `Estado inválido: ${playerDto.role}. Debe ser uno de ${PLAYER_ROLES}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (playerDto.password) {
      const hashedPassword = await bcrypt.hash(playerDto.password, 10);
      existingPlayer.password = hashedPassword;
    }
    if (['admin', 'vip', 'player'].includes(playerDto.role)) {
      existingPlayer.role = playerDto.role;
    }
    return await manager.save(Player, existingPlayer);
  }

  async remove(manager: EntityManager, id: number): Promise<void> {
    await manager.delete(Player, id);
  }

  async authenticate(
    manager: EntityManager, 
    authInfo: AuthenticateInfoDto,
  ): Promise<Player | undefined> {
    const { email, phone, password } = authInfo;
    if (!email && !phone) {
      throw new BadRequestException(
        'Debe proporcionar un nombre de usuario o un teléfono',
      );
    }
    if (!password) {
      throw new BadRequestException('Debe proporcionar una contraseña');
    }
    let player = await manager.findOne(Player, {
      where: [
        { email: email || ''},
        { phone: phone || ''},
      ],
    });
    if (!player) {
      throw new UnauthorizedException({
        statusCode: 403,
        message: 'Jugador no encontrado',
        error: 'CredentialNotExists',
      });
    }
    const isPasswordValid = await bcrypt.compare(password, player.password);
    if (!isPasswordValid) {
      if (password !== player.password) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Credenciales no válidas',
          error: 'CredentialSignIn',
        });
      }
    }
    return player;
  }

  async authenticateGoogle(
    manager: EntityManager, 
    authInfo: AuthenticateGoogleDto,
  ): Promise<Player | undefined> {
    try {
      const decodedToken = await this.verifyGoogleToken(authInfo.token);
      const { email, name, picture } = decodedToken as any;
      let player = await manager.findOne(Player, {
        where: { email: email as string },
      });
      if (!player) {
        const clubList = await manager.find(Club);
        player = await manager.save(Player, {
          email: email as string,
          name: name as string,
          role: 'player',
          picture: picture as string,
          clubs: clubList,
        });
      }
      return player;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Credenciales no válidas',
        error: 'CredentialSignIn',
      });
    }
  }

  private async verifyGoogleToken(token: string): Promise<any> {
    const client = jwksClient({
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    const decodedHeader = jwt.decode(token, { complete: true }) as any;
    const kid = decodedHeader.header.kid;

    const key = await client.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  }

  async updateFromFront(
    manager: EntityManager,
    id: number,
    playerUpdateDto: UpdatePlayerFrontDto,
  ): Promise<Player> {
    const { email, phone, password, name, surname, clubIds, role, balance } =
      playerUpdateDto;

    let existingPlayers: Player[];
    if (id) {
      existingPlayers = await manager.find(Player, {
        where: {
          id,
        },
      });
    } else {
      existingPlayers = await manager.find(Player, {
        where: {
          email: email || '',
        },
      });
      if (existingPlayers.length <= 0) {
        existingPlayers = await manager.find(Player, {
          where: [
            {
              phone: phone || '',
            },
          ],
        });
      }
      if (existingPlayers.length <= 0) {
        throw new BadRequestException('Jugador no encontrado');
      }
    }
    let existingPlayer: Player = existingPlayers[0];
    if (password) existingPlayer.password = password;
    if (email) existingPlayer.email = email;
    if (phone) existingPlayer.phone = phone;
    if (name) existingPlayer.name = name;
    if (surname) existingPlayer.surname = surname;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      existingPlayer.password = hashedPassword;
    }
    if (['admin', 'vip', 'player'].includes(role)) {
      existingPlayer.role = role;
    }
    existingPlayer.balance = balance;
    if (clubIds && clubIds.length > 0) {
      existingPlayer.clubs = await Promise.all(
        clubIds.map(async (clubId) => {
          let club = await manager.findOne(Club, {
            where: { id: clubId },
          });
          if (!club) {
            throw new HttpException(
              `Club ${clubId} no encontrado`,
              HttpStatus.NOT_FOUND,
            );
          }
          return club;
        }),
      );
    }
    return await manager.save(existingPlayer);
  }

  async findPlayerByEmail(manager: EntityManager, email: string): Promise<Player | undefined> {
    return await manager.findOne(Player, {
      where: { email },
    });
  }
}
