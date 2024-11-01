import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CashModule } from './cash/cash.module';
import { ClubModule } from './club/club.module';
import { CourtModule } from './court/court.module';
import { HourModule } from './hour/hour.module';
import { PlayerModule } from './player/player.module';
import { ReservationModule } from './reservation/reservation.module';
import { WeekModule } from './week/week.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: false,
    }),
    ClubModule,
    PlayerModule,
    CourtModule,
    ReservationModule,
    WeekModule,
    HourModule,
    AuthModule,
    CashModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
