import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CombinedGuard } from '../auth/guards/combined.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiFindAllResponse,
  ApiFindOneResponse,
  ApiUpdateResponse,
} from '../decorators/swagger-decorators';
import { ActivateHourGroupDto } from './dtos/activate-group.dto';
import { CreateHourGroupDto } from './dtos/create-hour-group.dto';
import { CreateHourDto } from './dtos/create-hour.dto';
import { GroupedHourDto } from './dtos/hour.dto';
import { HourGroup } from './hour-group.entity';
import { Hour } from './hour.entity';
import { HourService } from './hour.service';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('hour')
@Controller('hour')
@UseGuards(CombinedGuard)
export class HourController {
  constructor(
    private readonly hourService: HourService,
  ) {}

  @Post()
  @ApiCreateResponse(CreateHourDto)
  async create(@Body() hour: CreateHourDto): Promise<Hour> {
    Logger.log(`HourController.create(${hour})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.create(manager, hour);
        });
    });
    return result;
  }

  @Get()
  @ApiFindAllResponse(Hour)
  async findAll(): Promise<Hour[]> {
    Logger.log(`HourController.findAll()`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.findAll(manager);
        });
    });
    return result;
  }

  @Get(':id')
  @ApiFindOneResponse(Hour)
  async findOne(@Param('id') id: number): Promise<Hour> {
    Logger.log(`HourController.findOne(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.findOne(manager, id);
        });
    });
    return result;
  }

  @Delete(':id')
  @ApiDeleteResponse(CreateHourDto)
  async remove(
    @Param('id') id: number,
    @Query('force') force: string,
  ): Promise<void> {
    Logger.log(`HourController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.remove(manager, id);
        });
    });
    return result;
  }
}

@ApiTags('hour-group')
@Controller('hour-group')
@UseGuards(CombinedGuard)
export class HourGroupController {
  constructor(
    private readonly hourService: HourService,
  ) {}

  @Get()
  @ApiFindAllResponse(GroupedHourDto)
  async groupedHours(): Promise<GroupedHourDto> {
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          const groupedHour = await this.hourService.groupedHours(manager, false);
          return groupedHour[0];
        });
    });
    return result;
  }

  @Get('/all')
  @ApiFindAllResponse(GroupedHourDto)
  async groupedAllHours(): Promise<GroupedHourDto[]> {
    Logger.log(`HourGroupController.groupedAllHours()`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.groupedHours(manager, true);
        });
    });
    return result;
  }

  @Post()
  @ApiCreateResponse(CreateHourGroupDto)
  async createGroup(@Body() group: CreateHourGroupDto): Promise<HourGroup> {
    Logger.log(`HourGroupController.createGroup(${group})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.hourService.createGroup(manager, group);
        });
    });
    return result;
  }

  @Put(':id/activate/:active')
  @ApiUpdateResponse(HourGroup)
  async activateGroup(
    @Param('id') id: number,
    @Param('active') active: string,
  ): Promise<HourGroup> {
    Logger.log(`HourGroupController.activateGroup(${id}, ${active})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          const activeGroup: ActivateHourGroupDto = {
            id,
            active: active,
          };
          return await this.hourService.activateGroup(manager, activeGroup);
        });
    });
    return result;
  }
}
