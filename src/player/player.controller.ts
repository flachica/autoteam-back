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
import { AuthenticateInfoDto } from './dtos/authenticate.dto';
import { AuthenticateGoogleDto } from './dtos/authenticate.google.dto';
import { CreatePlayerDto } from './dtos/create-player.dto';
import { UpdatePlayerFrontDto } from './dtos/update-player-front.dto';
import { UpdatePlayerDto } from './dtos/update-player.dto';
import { Player } from './player.entity';
import { PlayerService } from './player.service';
import { PlayerResponseDto } from './dtos/player.response.dto';
import { getDataSource } from 'src/datasource.wrapper';

@ApiTags('player')
@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
  ) {}

  @Post()
  @ApiCreateResponse(CreatePlayerDto)
  async create(@Body() player: CreatePlayerDto): Promise<Player> {
    Logger.log(`PlayerController.create(${player.email})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.playerService.create(manager, player);
      });
    });
    return result;
  }

  @Get()
  @UseGuards(CombinedGuard)
  @ApiFindAllResponse(PlayerResponseDto)
  async findAll(): Promise<PlayerResponseDto[]> {
    Logger.log(`PlayerController.findAll()`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.playerService.findAll(manager);
      });
    });
    return result;
  }

  @Get(':id')
  @UseGuards(CombinedGuard)
  @ApiFindOneResponse(PlayerResponseDto)
  async findOne(@Param('id') id: number): Promise<PlayerResponseDto> {
    Logger.log(`PlayerController.findOne(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.playerService.findOneAsResponseDto(manager, id);
      });
    });
    return result;
  }

  @Put(':id')
  @UseGuards(CombinedGuard)
  @ApiUpdateResponse(UpdatePlayerDto)
  async update(
    @Param('id') id: number,
    @Body() player: UpdatePlayerFrontDto,
  ): Promise<Player> {
    Logger.log(`PlayerController.update(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.playerService.updateFromFront(manager, id, player);
      });
    });
    return result;
  }

  @Delete(':id')
  @UseGuards(CombinedGuard)
  @ApiDeleteResponse(CreatePlayerDto)
  async remove(@Param('id') id: number): Promise<void> {
    Logger.log(`PlayerController.remove(${id})`);
    let result;
    await getDataSource(async (dataSource) => {
      result = await dataSource.transaction(async (manager) => {
        return await this.playerService.remove(manager, id);
      });
    });
    return result;
  }

  @Post('/authenticate')
  @ApiCreateResponse(AuthenticateInfoDto)
  async authenticate(
    @Body() authInfo: AuthenticateInfoDto,
  ): Promise<Player | undefined> {
    Logger.log(`PlayerController.authenticate(${authInfo.email})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {    
          return await this.playerService.authenticate(manager, authInfo);    
      });
    });
    return result;
  }

  @Post('/authenticateGoogle')
  @ApiCreateResponse(AuthenticateGoogleDto)
  async authenticateGoogle(
    @Body() authInfo: AuthenticateGoogleDto,
  ): Promise<Player | undefined> {
    Logger.log(`PlayerController.authenticateGoogle(${authInfo.token})`);
    let result;
    await getDataSource(async (dataSource) => {
        result = await dataSource.transaction(async (manager) => {
          return await this.playerService.authenticateGoogle(manager, authInfo);
        });
    });
    return result;
  }
}
