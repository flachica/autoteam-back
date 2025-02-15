import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CombinedGuard } from '../auth/guards/combined.guard';
import { Movement } from '../cash/movement.entity';
import { Court } from '../court/court.entity';
import { InvitedAnonPlayer } from '../court/invited.anon.player.entity';
import { InvitedPlayer } from '../court/invited.player.entity';
import { HourGroup } from '../hour/hour-group.entity';
import { Hour } from '../hour/hour.entity';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { PlayerService } from '../player/player.service';
import { ClubController } from './club.controller';
import { Club } from './club.entity';
import { ClubService } from './club.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Club,
      Player,
      Movement,
      Court,
      HourGroup,
      Hour,
      InvitedPlayer,
      InvitedAnonPlayer,
    ]),
    forwardRef(() => PlayerModule),
  ],
  controllers: [ClubController],
  providers: [ClubService, CombinedGuard, PlayerService],
})
export class ClubModule {}
