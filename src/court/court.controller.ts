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
  Req,
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
import { Court } from './court.entity';
import { CourtService } from './court.service';
import { CourtOperationDto } from './dtos/court-operation.dto';
import { CreateCourtDto } from './dtos/create-court.dto';
import { OpenWeekDtoResponse } from './dtos/open-week-response.dto';
import { OpenWeekDto } from './dtos/open-week.dto';
import { UpdateCourtDto } from './dtos/update-court.dto';
import { DataSource } from 'typeorm';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('court')
@Controller('court')
@UseGuards(CombinedGuard)
export class CourtController {
  constructor(
    private readonly courtService: CourtService,
    private dataSource: DataSource,
  ) {}

  @Get('/pending-reservations')
  @ApiFindAllResponse(Court)
  async findPendingReservations(): Promise<Court[]> {
    Logger.log(`CourtController.findPendingReservations()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.courtWithoutReservation(manager);
      });
    });
    return result;
  }

  @Post()
  @ApiCreateResponse(CreateCourtDto)
  async create(@Body() court: CreateCourtDto, @Req() req): Promise<Court> {
    Logger.log(`CourtController.create(${court})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.create(manager, court, req.user.id ?? req.user.email);
      });
    });
    return result;
  }

  @Post(':courtId/setmein')
  @ApiCreateResponse(CourtOperationDto)
  async setMeIn(
    @Param('courtId') courtId: number,
    @Body() courtOperation: CourtOperationDto,
  ): Promise<Court> {
    Logger.log(`CourtController.setMeIn(${courtId})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.setMeIn(manager, courtId, courtOperation);
      });
    });
    return result;
  }

  @Post(':courtId/setmeout')
  @ApiCreateResponse(CourtOperationDto)
  async setMeOut(
    @Param('courtId') courtId: number,
    @Body() courtOperation: CourtOperationDto,
  ): Promise<Court> {
    Logger.log(`CourtController.setMeOut(${courtId})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.setMeOut(manager, courtId, courtOperation);
      });
    });
    return result;
  }

  @Get()
  @ApiFindAllResponse(Court)
  async findAll(): Promise<Court[]> {
    Logger.log(`CourtController.findAll()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.findAll(manager);
      });
    });
    return result;
  }

  @Get(':id')
  @ApiFindOneResponse(Court)
  async findOne(@Param('id') id: number): Promise<Court> {
    Logger.log(`CourtController.findOne(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.findOne(manager, id);
      });
    });
    return result;
  }

  @Put(':id')
  @ApiUpdateResponse(UpdateCourtDto)
  async update(
    @Param('id') id: number,
    @Body() court: UpdateCourtDto,
    @Query('sustitute') sustitute: number,
  ): Promise<Court> {
    Logger.log(`CourtController.update(${id}, ${court})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.update(manager, id, court, sustitute);
      });
    });
    return result;
  }

  @Delete(':id')
  @ApiDeleteResponse(CreateCourtDto)
  async remove(
    @Param('id') id: number,
    @Query('force') force: string,
  ): Promise<void> {
    Logger.log(`CourtController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.remove(manager, id, force === 'true');
      });
    });
    return result;
  }

  @Post('/open-week/')
  @ApiCreateResponse(OpenWeekDto)
  async openWeek(
    @Body() openWeekInfo: OpenWeekDto,
    @Req() req,
  ): Promise<OpenWeekDtoResponse> {
    Logger.log(`CourtController.openWeek(${openWeekInfo})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.courtService.openWeek(manager, openWeekInfo, req.user.id);
      });
    });
    return result;
  }
}
