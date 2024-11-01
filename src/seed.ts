import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClubService } from './club/club.service';
import { ActivateHourGroupDto } from './hour/dtos/activate-group.dto';
import { HourService } from './hour/hour.service';
import { PlayerService } from './player/player.service';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { HourGroup } from './hour/hour-group.entity';
import { Hour } from './hour/hour.entity';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Debes pasar el fichero con los horarios');
    process.exit(1);
  }
  const dataSource = app.get(DataSource);
  await dataSource.transaction(async (manager) => {
    const clubService = app.get(ClubService);
    const playerService = app.get(PlayerService);
    const hourService = app.get(HourService);
    
    // Crear clubes
    let existingClubs = await clubService.findAll(manager);
    let clubs = [];
    if (existingClubs.length <= 0) {
      clubs.push(await clubService.create(manager, { name: `Padel 1` }));
    } else {
      clubs = existingClubs;
      console.log('Ya hay clubes');
    }

    let existingPlayers = await playerService.findAll(manager);
    let players = [];
    if (existingPlayers.length <= 0) {    
      let phone = Math.floor(Math.random() * 1000000000).toString();
      const myPlayer = await playerService.create(manager, {
        name: `Player 1`,
        clubs: [clubs[0].id],
        phone: phone,
        email: 'admin',
        password: 'admin',
        role: 'admin',
      });
      players.push(
        myPlayer
      );
    } else {
      players = existingPlayers;
      console.log('Ya hay jugadores');
    }

    let days = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ];
    const jsonFilePath = path.resolve(args[0]);
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`File not found: ${jsonFilePath}`);
      process.exit(1);
    }
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    console.log(jsonData);
    
    let hourGroup = await manager.findOne(HourGroup, {
      where: {
        name: jsonData.name,
      },
    });
    if (hourGroup) {
      console.log(`Grupo ${jsonData.name} ya existe. Actualizando`);
    } else {
      console.log(`Grupo ${jsonData.name} no existe. Creando`);
      hourGroup = await hourService.createGroup(manager, {
        name: jsonData.name
      });
    }
    let index = 0;
    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < jsonData.hours.length; j++) {
        index += 1;
        const hourData = jsonData.hours[j];
        const { name, price, operation } = hourData;
        const hour = await manager.findOne(Hour, {
          where: {
            day_name: days[i],
            name: name,
          },
        })
        if ( operation === 'remove') {
          console.log(`Hora ${name} en ${days[i]} se va a eliminar`);
          if (hour) {
            await manager.remove(Hour, hour);
          }
          continue;
        }
        if (hour) {
          console.log(`Hora ${name} en ${days[i]} ya existe. Actualizando`);
          await manager.save(Hour, {
            id: hour.id,
            price: price,
            active: true,
            index: index * 10,
          });
        } else {
          console.log(`Hora ${name} en ${days[i]} no existe. Creando`);
          await hourService.create(manager, {
            groupId: hourGroup.id,
            name: name,
            day_name: days[i],
            index: index * 10,
            price: price,
            active: true,
          });
        }
      }
    }
      
    const activateInfo: ActivateHourGroupDto = {
      id: hourGroup.id,
      active: 'true',
    };
    await hourService.activateGroup(manager, activateInfo);
  });
  await app.close();
}

bootstrap();
