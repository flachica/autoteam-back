import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClubService } from './club/club.service';
import { CourtService } from './court/court.service';
import { ActivateHourGroupDto } from './hour/dtos/activate-group.dto';
import { HourService } from './hour/hour.service';
import { PlayerService } from './player/player.service';
import { saltAndHashPassword } from './utils/passwordUtils';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  this.dataSource.transaction(async (manager) => {

    const courtService = app.get(CourtService);
    const clubService = app.get(ClubService);
    const playerService = app.get(PlayerService);
    const hourService = app.get(HourService);
    const myPlayerId = 1;

    // Crear clubes
    let existingClubs = await clubService.findAll(manager);
    let clubs = [];
    if (existingClubs.length <= 0) {
      for (let i = 1; i < 3; i++) {
        clubs.push(await clubService.create(manager, { name: `Club ${i}` }));
      }
    } else {
      clubs = existingClubs;
      console.log('Clubes ya existen');
    }

    let existingPlayers = await playerService.findAll(manager);
    let players = [];
    if (existingPlayers.length <= 0) {
      for (let i = 1; i < 6; i++) {
        let phone = Math.floor(Math.random() * 1000000000).toString();
        const password = await saltAndHashPassword('admin');
        players.push(
          await playerService.create(manager, {
            name: `Player ${i}`,
            clubs: [clubs[0].id],
            phone: phone,
            password: password,
          }),
        );
      }
    } else {
      players = existingPlayers;
      console.log('Players ya existen');
    }

    let existingCourts = await courtService.findAll(manager);
    if (existingCourts.length <= 0) {
      let today = new Date();
      let dayOfWeek = today.getDay();
      let monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

      for (let i = 1; i < 5; i++) {
        // elegir 4 al azar de players
        let courtPlayers = [];
        let max = Math.floor(Math.random() * 5);
        for (let j = 0; j < max; j++) {
          courtPlayers.push(players[j]);
        }
        let day = new Date(monday);
        day.setDate(day.getDate() + i);
        await courtService.create(manager,
          {
            name: `Court ${i}`,
            club: clubs[0].id,
            date: day.toLocaleDateString('es-ES'),
            hour: '20:30',
            minPlayers: 4,
            maxPlayers: 4,
            state: 'opened',
            price: 5.6,
            players: courtPlayers.map((player) => player.id),
          },
          myPlayerId.toString(),
        );
      }
    } else {
      console.log('Courts ya existen');
    }

    let existingGroups = await hourService.groupedHours(manager, false);
    if (existingGroups.length <= 0) {
      let days = [
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
      ];
      let group = await hourService.createGroup(manager, { name: 'Invierno' });
      let j = 0;
      for (let i = 0; i < days.length; i++) {
        await hourService.create(manager, {
          groupId: group.id,
          name: '18:00',
          day_name: days[i],
          index: j * 10,
          price: 5,
          active: true,
        });
        j++;
        await hourService.create(manager, {
          groupId: group.id,
          name: '19:30',
          day_name: days[i],
          index: j * 10,
          price: 7.5,
          active: true,
        });
        j++;
      }

      group = await hourService.createGroup(manager, { name: 'Verano' });
      j = 0;
      for (let i = 0; i < days.length; i++) {
        await hourService.create(manager, {
          groupId: group.id,
          name: '19:00',
          day_name: days[i],
          index: j * 10,
          price: 5,
          active: true,
        });
        j++;
        await hourService.create(manager, {
          groupId: group.id,
          name: '20:30',
          day_name: days[i],
          index: j * 10,
          price: 7.5,
          active: true,
        });
        j++;
      }
      const activateInfo: ActivateHourGroupDto = {
        id: group.id,
        active: 'true',
      };
      await hourService.activateGroup(manager, activateInfo);
    } else {
      console.log('Hours ya existen');
    }
  });
  await app.close();
}

bootstrap();
