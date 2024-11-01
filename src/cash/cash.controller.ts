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
} from '../decorators/swagger-decorators';
import { CashService } from './cash.service';
import { FilterAllMovementDto } from './dtos/filter-all-movement.dto';
import { FilterMovementDto } from './dtos/filter-movement.dto';
import { PaginatedMovements } from './dtos/paginated-cash.dto';
import { UpdateMovementDto } from './dtos/update-movement.dto';
import { Movement } from './movement.entity';
import { DataSource } from 'typeorm';
import { MovementDto } from './dtos/movement.dto';
import { CreateMovementDto } from './dtos/create-movement.dto';
import { getDataSource } from 'src/datasource.wrapper';

@Controller('cash')
@ApiTags('cash')
@UseGuards(CombinedGuard)
export class CashController {
  constructor(
    private readonly cashService: CashService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('/movement')
  @ApiFindAllResponse(Movement)
  async findCashMovements(
    @Query() filter: FilterMovementDto,
  ): Promise<PaginatedMovements> {
    Logger.log(`CashController.findCashMovements(${JSON.stringify(filter)})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.cashService.findCashMovements(manager, filter);
        });
    });
    return result;
  }

  @Get('/movement/all')
  @ApiFindAllResponse(Movement)
  async findAllCashMovements(
    @Query() filter: FilterAllMovementDto,
  ): Promise<PaginatedMovements> {
    Logger.log(`CashController.findAllCashMovements(${JSON.stringify(filter)})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return this.cashService.findAllCashMovements(manager, filter);
      });
    });
    return result;
  }

  @Delete('/movement/:id')
  @ApiDeleteResponse(MovementDto)
  async remove(@Param('id') id: number): Promise<void> {
    Logger.log(`CashController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.cashService.remove(manager, id);
        });
    });
    return result;
  }

  @Put('/movement/:id')
  @ApiCreateResponse(UpdateMovementDto)
  async update(
    @Param('id') id: number,
    @Body() updateMovementDto: UpdateMovementDto,
  ): Promise<Movement> {
    Logger.log(`CashController.update(${id}, ${JSON.stringify(updateMovementDto)})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.cashService.update(manager, id, updateMovementDto);
        });
    });
    return result;
  }

  @Post('/movement')
  @ApiCreateResponse(CreateMovementDto)
  async createMovement(
    @Body() createMovementDto: CreateMovementDto,
  ): Promise<Movement> {
    Logger.log(`CashController.createMovement(${JSON.stringify(createMovementDto)})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.cashService.create(manager, createMovementDto);
        });
    });
    return result;
  }
}
