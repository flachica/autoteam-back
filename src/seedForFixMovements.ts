import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClubService } from './club/club.service';
import { ActivateHourGroupDto } from './hour/dtos/activate-group.dto';
import { HourService } from './hour/hour.service';
import { PlayerService } from './player/player.service';
import * as dotenv from 'dotenv';
import { DataSource, IsNull, Not } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { HourGroup } from './hour/hour-group.entity';
import { Hour } from './hour/hour.entity';
import { CashService } from './cash/cash.service';
import { CourtService } from './court/court.service';
import { Movement } from './cash/movement.entity';
import { InvitedPlayer } from './court/invited.player.entity';
import { Player } from './player/player.entity';
import { InvitedAnonPlayer } from './court/invited.anon.player.entity';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get(DataSource);
  await dataSource.transaction(async (manager) => {
    let createdMovements = 0;
    const cashService = app.get(CashService);
    const courtService = app.get(CourtService);

    const movements = await manager.find(Movement, {
      where: { court: Not(IsNull()) },
    });
    console.log('Movimientos en pistas', movements.length);
    if (movements.length) {
      await manager.delete(
        Movement,
        movements.map((movement) => movement.id),
      );
    }
    let existingCourts = await courtService.findDetailedAll(manager);
    for (let i = 0; i < existingCourts.length; i++) {
      const court = existingCourts[i];
      if (
        court.players.length +
          court.invitedPlayers.length +
          court.anonPlayers.length ===
        4
      ) {
        for (let j = 0; j < court.players.length; j++) {
          createdMovements++;
          await courtService.createCashMovement(
            manager,
            court,
            court.players[j].id,
            null,
            true,
            true,
          );
        }
        for (let j = 0; j < court.invitedPlayers.length; j++) {
          createdMovements++;
          let invitedPlayer = await manager.findOne(Player, {
            where: { id: court.invitedPlayers[j].id },
          });
          const existingInvitedEntity = await manager.findOne(InvitedPlayer, {
            where: { id: invitedPlayer.id },
            relations: ['payerPlayer'],
          });
          await courtService.createCashMovementFromInvited(
            manager,
            court,
            existingInvitedEntity.payerPlayer.id,
            'Invitando a ' + invitedPlayer.name + ' ' + invitedPlayer.surname,
            true,
            true,
          );
        }
        for (let j = 0; j < court.anonPlayers.length; j++) {
          createdMovements++;
          const existingInvitedEntity = await manager.findOne(
            InvitedAnonPlayer,
            {
              where: { id: court.anonPlayers[j].id },
              relations: ['payerPlayer'],
            },
          );

          await courtService.createCashMovementFromInvited(
            manager,
            court,
            existingInvitedEntity.payerPlayer.id,
            'Invitando a ' + existingInvitedEntity.nameAnonPlayer,
            true,
            true,
          );
        }
      }
    }
    console.log('Movimientos creados', createdMovements);
  });
  await app.close();
}

bootstrap();
