import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HourGroup } from './hour-group.entity';
import { HourController, HourGroupController } from './hour.controller';
import { Hour } from './hour.entity';
import { HourService } from './hour.service';

@Module({
  imports: [TypeOrmModule.forFeature([Hour, HourGroup])],
  providers: [HourService],
  controllers: [HourController, HourGroupController],
})
export class HourModule {}
