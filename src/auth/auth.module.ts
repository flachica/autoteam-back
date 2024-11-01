import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../player/player.entity';
import { PlayerModule } from '../player/player.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CombinedGuard } from './guards/combined.guard';
import { JwtStrategy } from './guards/jwt.strategy';
import { PlayerService } from 'src/player/player.service';
import { MagicLoginStrategy } from './guards/magiclogin.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.AUTH_SECRET,
        signOptions: {
          expiresIn: process.env.MAGIC_TOKEN_EXPIRES_IN,
          keyid: process.env.MAGIC_TOKEN_KEY_ID,
        },
        global: true,
      }),
    }),
    PlayerModule,
    PassportModule.register({ defaultStrategy: 'magic-login' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CombinedGuard, PlayerService, MagicLoginStrategy],
})
export class AuthModule {}
