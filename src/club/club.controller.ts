import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
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
import { Club } from './club.entity';
import { ClubService } from './club.service';
import { CreateClubDto } from './dtos/create-club.dto';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('club')
@Controller('club')
@UseGuards(CombinedGuard)
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
  ) {}

  @Post()
  @ApiCreateResponse(CreateClubDto)
  async create(@Body() club: CreateClubDto): Promise<Club> {
    Logger.log(`ClubController.create(${club})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.clubService.create(manager, club);
      });
    });
    return result;
  }

  @Get()
  @ApiFindAllResponse(Club)
  async findAll(): Promise<Club[]> {
    Logger.log(`ClubController.findAll()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.clubService.findAll(manager);
      });
    });
    return result;
  }

  @Get(':id')
  @ApiFindOneResponse(Club)
  async findOne(@Param('id') id: number): Promise<Club> {
    Logger.log(`ClubController.findOne(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.clubService.findOne(manager, id);
      });
    });
    return result;
  }

  @Put(':id')
  @ApiUpdateResponse(CreateClubDto)
  async update(@Param('id') id: number, @Body() club: CreateClubDto): Promise<Club> {
    Logger.log(`ClubController.update(${id}, ${club})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.clubService.update(manager, id, club);
      });
    });
    return result;
  }

  @Delete(':id')
  @ApiDeleteResponse(CreateClubDto)
  async remove(@Param('id') id: number): Promise<void> {
    Logger.log(`ClubController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.clubService.remove(manager, id);
      });
    });
    return result;
  }
}
