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
import { getDataSource } from 'src/datasource.wrapper';
import { CombinedGuard } from '../auth/guards/combined.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiFindAllResponse,
} from '../decorators/swagger-decorators';
import { CashService } from './cash.service';
import { CreateMonthlyCostDto } from './dtos/create-monthly-cost.dto';
import { CreateMovementDto } from './dtos/create-movement.dto';
import { FilterAllMovementDto } from './dtos/filter-all-movement.dto';
import { FilterMovementDto } from './dtos/filter-movement.dto';
import { MovementDto } from './dtos/movement.dto';
import { PaginatedMovements } from './dtos/paginated-cash.dto';
import { UpdateMovementDto } from './dtos/update-movement.dto';
import { MonthlyCost } from './monthly.cost.entity';
import { Movement } from './movement.entity';

@Controller('cash')
@ApiTags('cash')
@UseGuards(CombinedGuard)
export class CashController {
  constructor(private readonly cashService: CashService) {}

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
    Logger.log(
      `CashController.findAllCashMovements(${JSON.stringify(filter)})`,
    );
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
    Logger.log(
      `CashController.update(${id}, ${JSON.stringify(updateMovementDto)})`,
    );
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
    Logger.log(
      `CashController.createMovement(${JSON.stringify(createMovementDto)})`,
    );
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.cashService.create(manager, createMovementDto);
      });
    });
    return result;
  }

  @Post('/monthly-cost')
  @ApiCreateResponse(CreateMonthlyCostDto)
  async createMonthlyCost(
    @Body() createMonthlyCostDto: CreateMonthlyCostDto,
  ): Promise<Movement> {
    Logger.log(
      `CashController.createMonthlyCost(${JSON.stringify(createMonthlyCostDto)})`,
    );
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.cashService.createMonthlyCost(
          manager,
          createMonthlyCostDto,
        );
      });
    });
    return result;
  }

  @Get('/monthly-cost')
  @ApiFindAllResponse(MonthlyCost)
  async findMonthlyCosts(): Promise<MonthlyCost[]> {
    Logger.log(`CashController.findMonthlyCosts()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.cashService.findMonthlyCost(manager);
      });
    });
    return result;
  }

  @Delete('/monthly-cost/:id')
  @ApiDeleteResponse(MonthlyCost)
  async removeMonthlyCost(@Param('id') id: number): Promise<void> {
    Logger.log(`CashController.removeMonthlyCost(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.cashService.removeMonthlyCost(manager, id);
      });
    });
    return result;
  }
}
