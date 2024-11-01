import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CombinedGuard } from '../auth/guards/combined.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiFindAllResponse,
  ApiFindOneResponse,
} from '../decorators/swagger-decorators';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationDto } from './dtos/reservation.dto';
import { ReservationService } from './reservation.service';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('reservation')
@Controller('reservation')
@UseGuards(CombinedGuard)
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
  ) {}

  @Post()
  @ApiCreateResponse(CreateReservationDto)
  async create(
    @Body() reservation: CreateReservationDto,
  ): Promise<ReservationDto> {
    Logger.log(`ReservationController.create(${reservation})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {    
        const createResult = await this.reservationService.create(manager, reservation);
        let result = new ReservationDto();
        result.id = createResult.id;
        result.courtId = createResult.courtId;
        return result;
      });
    });
    return result;
  }

  @Get()
  @ApiFindAllResponse(ReservationDto)
  async findAll(): Promise<ReservationDto[]> {
    Logger.log(`ReservationController.findAll()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.reservationService.findAll(manager);
      });
    });
    return result;
  }

  @Get(':id')
  @ApiFindOneResponse(ReservationDto)
  async findOne(@Param('id') id: number): Promise<ReservationDto> {
    Logger.log(`ReservationController.findOne(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return this.reservationService.findOne(manager, id);
      });
    });
    return result;
  }

  @Post(':id/delete')
  @ApiDeleteResponse(CreateReservationDto)
  async remove(
    @Param('id') id: number,
    @Body() reservation: CreateReservationDto,
  ): Promise<void> {
    Logger.log(`ReservationController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.reservationService.remove(manager, id, reservation);
      });
    });
    return result;
  }
}
