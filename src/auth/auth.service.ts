import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager, } from 'typeorm';
import { Player } from '../player/player.entity';
import { PlayerService } from 'src/player/player.service';
import { isValid } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly playerService: PlayerService,
  ) {}

  async oAuthLogin(manager: EntityManager, user) {
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.UNAUTHORIZED);
    }

    let player = await manager.findOne(Player, {
      where: { email: user.email },
    });
    if (!player) {
      player = await manager.save(Player, {
        email: user.email,
        name: user.name,
        role: 'player',
      });
    }

    const payload = {
      email: user.email,
      name: user.name,
      isValid: true,
    };

    const jwt = await this.jwtService.sign(payload);

    return { jwt };
  }

  async passportLogin(manager: EntityManager, destination: string) {
    let player = await manager.findOne(Player, {
      where: { email: destination },
    });
    if (!player) {
      throw new HttpException('Usuario no encontrado', HttpStatus.UNAUTHORIZED);
    }
    return await this.playerService.findOneAsResponseDto(manager, player.id);
  }

  async passportLoginReturnJWT(manager: any, destination: string) {
    let payload = await this.passportLogin(manager, destination);
    return await this.jwtService.sign(payload, {
      keyid: process.env.MAGIC_TOKEN_KEY_ID,
    });
  }
}
