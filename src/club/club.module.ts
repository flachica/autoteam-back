import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombinedGuard } from '../auth/guards/combined.guard';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { PlayerService } from '../player/player.service';
import { ClubController } from './club.controller';
import { Club } from './club.entity';
import { Movement } from 'src/cash/movement.entity';
import { Court } from 'src/court/court.entity';
import { Hour } from 'src/hour/hour.entity';
import { HourGroup } from 'src/hour/hour-group.entity';
import { InvitedPlayer } from 'src/court/invited.player.entity';
import { InvitedAnonPlayer } from 'src/court/invited.anon.player.entity';
import { ClubService } from './club.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Club, Player, Movement, Court, HourGroup, Hour, InvitedPlayer, InvitedAnonPlayer]),
    forwardRef(() => PlayerModule),
  ],
  controllers: [ClubController],
  providers: [ClubService, CombinedGuard, PlayerService],
})
export class ClubModule {}
