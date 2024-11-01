import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CombinedGuard } from '../auth/guards/combined.guard';
import { ApiFindOneResponse } from '../decorators/swagger-decorators';
import { PlayerService } from '../player/player.service';
import { WeekDto } from './dtos/week.dto';
import { WeekService } from './week.service';
import { DataSource } from 'typeorm';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('week')
@Controller('week')
@UseGuards(CombinedGuard)
export class WeekController {
  constructor(
    private readonly weekService: WeekService,
    private readonly playerService: PlayerService,
    private dataSource: DataSource,
  ) {}

  @Get(':date')
  @ApiFindOneResponse(WeekDto)
  async findOne(@Param('date') weekDay: string, @Req() req): Promise<WeekDto> {
    Logger.log(`WeekController.findOne(${weekDay})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        const myPlayer = await this.playerService.findOne(manager, req.user.id);
        return await this.weekService.findOne(manager, weekDay, myPlayer);
      });
    });
    return result;
  }
}
