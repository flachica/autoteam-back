import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { mapDtoToEntity } from '../decorators/automap';
import { HandleDabaseConstraints } from '../decorators/contraint-handlers';
import { ActivateHourGroupDto } from './dtos/activate-group.dto';
import { CreateHourGroupDto } from './dtos/create-hour-group.dto';
import { CreateHourDto } from './dtos/create-hour.dto';
import { DayDto, GroupedHourDto } from './dtos/hour.dto';
import { HourGroup } from './hour-group.entity';
import { Hour } from './hour.entity';

@Injectable()
export class HourService {
  
  @HandleDabaseConstraints()
  async create(manager: EntityManager, createHourDto: CreateHourDto): Promise<Hour> {
    let existingGroup = await manager.findOne(HourGroup, {
      where: { id: createHourDto.groupId },
    });
    if (!existingGroup) {
      throw new HttpException(
        `Horario ${createHourDto.groupId} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    const hour = mapDtoToEntity(createHourDto, new Hour());
    return await manager.save(Hour, hour);
  }

  async groupedHours(manager: EntityManager, all: boolean): Promise<GroupedHourDto[]> {
    const onlyActive = !all;
    const filter = onlyActive ? { where: { active: true } } : {};
    const existingGroup = await manager.find(HourGroup, filter);
    let result: GroupedHourDto[] = [];
    for (const group of existingGroup) {
      const hourFilter = {
        where: {
          groupId: group.id,
          ...(onlyActive && { active: true }), // Añade el filtro active solo si onlyActive es true
        },
        order: {
          index: 'ASC' as const,
        },
      };
      const hours = await manager.find(Hour, hourFilter);
      let days = new Map<string, DayDto>();
      for (const hour of hours) {
        if (!days.has(hour.day_name)) {
          days.set(hour.day_name, {
            day_name: hour.day_name,
            hours: [],
          });
        }
        days.get(hour.day_name).hours.push(hour);
      }
      let groupDto = new GroupedHourDto();
      groupDto.id = group.id;
      groupDto.group_name = group.name;
      groupDto.active = group.active;
      groupDto.days = Array.from(days.values());
      result.push(groupDto);
    }
    return result;
  }

  async findAll(manager: EntityManager, ): Promise<Hour[]> {
    const result = await manager.find(Hour, {
      where: { active: true },
    });
    return result;
  }

  async findOne(manager: EntityManager, id: number): Promise<Hour> {
    const result = await manager.findOne(Hour, {
      where: {
        id,
        active: true,
      },
    });
    return result;
  }

  @HandleDabaseConstraints()
  async remove(manager: EntityManager, id: number): Promise<void> {
    const existingHour = await this.findOne(manager, id);
    if (!existingHour) {
      throw new HttpException('Hora no encontrada', HttpStatus.NOT_FOUND);
    }
    await manager.delete(Hour, { id: existingHour.id });
  }

  @HandleDabaseConstraints()
  async createGroup(manager: EntityManager, group: CreateHourGroupDto): Promise<HourGroup> {
    let existingGroup = await manager.findOne(HourGroup, {
      where: {
        name: group.name,
        active: true,
      },
    });
    if (existingGroup) {
      throw new HttpException(
        `Horario ${group.name} ya existe`,
        HttpStatus.CONFLICT,
      );
    }
    existingGroup = await manager.findOne(HourGroup, {
      where: { name: group.name },
    });
    if (existingGroup) {
      existingGroup.active = true;
      await manager.save(HourGroup, existingGroup);
      return existingGroup;
    }
    let newHourGroup = new HourGroup();
    newHourGroup.name = group.name;
    newHourGroup.active = true;
    return await manager.save(HourGroup, newHourGroup);
  }

  @HandleDabaseConstraints()
  async removeGroup(manager: EntityManager, id: number): Promise<void> {
    const existingGroup = await manager.findOne(HourGroup, {
      where: { id },
    });
    if (!existingGroup) {
      throw new HttpException(
        `Horario ${id} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    existingGroup.active = false;
    await manager.save(HourGroup, existingGroup);
  }

  @HandleDabaseConstraints()
  async activateGroup(manager: EntityManager, group: ActivateHourGroupDto): Promise<HourGroup> {
    let existingGroups = await manager.find(HourGroup);
    if (existingGroups.length <= 0) {
      throw new HttpException(
        'No se encontraron horarios',
        HttpStatus.NOT_FOUND,
      );
    }
    for (const existingGroup of existingGroups) {
      existingGroup.active = false;
      await manager.save(HourGroup, existingGroup);
    }
    const existingGroup = await manager.findOne(HourGroup, {
      where: { id: group.id },
    });
    if (!existingGroup) {
      throw new HttpException(
        `Horario ${group.id} no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }
    existingGroup.active = group.active === 'true';
    return await manager.save(HourGroup, existingGroup);
  }
}
