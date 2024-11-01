import { Injectable } from '@nestjs/common';
import { Between, EntityManager } from 'typeorm';
import { Club } from '../club/club.entity';
import { Court } from '../court/court.entity';
import { Player } from '../player/player.entity';
import { ClubDto } from './dtos/club.dto';
import { CourtDto } from './dtos/court.dto';
import { CourtPlayerDto } from './dtos/courtPlayer.dto';
import { WeekDto } from './dtos/week.dto';
import { InvitedPlayer } from 'src/court/invited.player.entity';
import { CourtAnonPlayerDto } from './dtos/courtAnonPlayer.dto';

@Injectable()
export class WeekService {
  constructor() {}

  async findOne(manager: EntityManager, weekDay: string, myPlayer: Player): Promise<WeekDto> {
    const clubs = await manager.find(Club, {
      relations: ['players'],
    });
    let { mondayWeekDay, sundayWeekDay } = this.weekDates(weekDay);
    const courts = await manager.find(Court, {
      where: {
        date: Between(mondayWeekDay, sundayWeekDay),
      },
      relations: ['club', 'players', 'invitedPlayers', 'invitedPlayers.payerPlayer', 'anonPlayers', 'anonPlayers.payerPlayer'],
      order: {
        date: 'ASC',
      },
    });
    let result: WeekDto = new WeekDto();
    result.week = this.getWeekName(mondayWeekDay, sundayWeekDay);
    let clubsDto: ClubDto[] = [];
    for (let club of clubs) {
      if (club.players.length === 0) {
        continue;
      }
      if (!club.players.find((player) => player.id === myPlayer.id)) {
        continue;
      }
      let clubDto: ClubDto = new ClubDto();
      clubDto.id = club.id;
      clubDto.name = club.name;
      let courtsDto: CourtDto[] = [];
      for (let court of courts) {
        if (court.club.id === club.id) {
          let courtDto: CourtDto = new CourtDto();
          courtDto.id = court.id;
          courtDto.name = court.name;
          courtDto.day_name = court.date.toLocaleString('es-ES', {
            weekday: 'long',
          });
          courtDto.day_name = this.capitalizeFirstLetter(courtDto.day_name);
          courtDto.day_date = court.date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          let courtPlayersDto: CourtPlayerDto[] = [];
          let invitedPlayersDto: CourtPlayerDto[] = [];
          let anonPlayersDto: CourtAnonPlayerDto[] = [];
          for (let player of court.players) {
            let playerDto: CourtPlayerDto = new CourtPlayerDto();
            playerDto.id = player.id;
            playerDto.name = player.name;
            playerDto.surname = player.surname;
            courtPlayersDto.push(playerDto);
          }
          const invitedPlayersEntity = await manager.find(InvitedPlayer, {
            where: {
              court: court,
            },
            relations: ['payerPlayer', 'invitedPlayer'],
          });
        
          if (invitedPlayersEntity) {            
            for (let invitedPlayer of invitedPlayersEntity) {
              let playerDto: CourtPlayerDto = new CourtPlayerDto();              
              playerDto.id = invitedPlayer.invitedPlayer.id;
              playerDto.name = invitedPlayer.invitedPlayer.name;
              playerDto.surname = invitedPlayer.invitedPlayer.surname;
              playerDto.payerPlayerId = invitedPlayer.payerPlayer.id;
              
              invitedPlayersDto.push(playerDto);
            }
          }
          if (court.anonPlayers) {
            for (let anonPlayer of court.anonPlayers) {
              let anonPlayerDto: CourtAnonPlayerDto = new CourtAnonPlayerDto();
              anonPlayerDto.id = anonPlayer.id;
              anonPlayerDto.nameAnonPlayer = anonPlayer.nameAnonPlayer;
              anonPlayerDto.payerPlayerId = anonPlayer.payerPlayer?.id;
              anonPlayersDto.push(anonPlayerDto);
            }
          }
          courtDto.players = courtPlayersDto;
          courtDto.invitedPlayers = invitedPlayersDto;
          courtDto.anonPlayers = anonPlayersDto;
          courtDto.court_state = court.state;
          courtDto.hour = court.hour;
          courtDto.price = court.price;
          courtsDto.push(courtDto);
        }
      }
      clubDto.courts = courtsDto;
      clubsDto.push(clubDto);
    }

    result.clubs = clubsDto;
    result.currentBalance = myPlayer.balance;
    return result;
  }

  private weekDates(weekDay: string) {
    let mondayWeekDay = new Date(weekDay);
    const weekDayWords = weekDay.split('-');
    mondayWeekDay = new Date(
      parseInt(weekDayWords[2]),
      parseInt(weekDayWords[1]) - 1,
      parseInt(weekDayWords[0]),
    );
    let sundayWeekDay = new Date(mondayWeekDay);
    sundayWeekDay.setDate(mondayWeekDay.getDate() + 6);
    return { mondayWeekDay, sundayWeekDay };
  }

  private getWeekName(mondayWeekDay: Date, sundayWeekDay: Date): string {
    let result: string;
    let day = mondayWeekDay.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    result = `${day} - `;
    day = sundayWeekDay.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return (result += `${day}`);
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
