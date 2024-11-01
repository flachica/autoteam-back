import { Body, Controller, Get, Logger, Post, Req, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { getDataSource } from 'src/datasource.wrapper';
import { MagicLoginStrategy } from './guards/magiclogin.strategy';
import { PasswordLessDto } from './dtos/passwordless.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private strategy: MagicLoginStrategy,
  ) {}

  @Post('login')
  async loginWithMagicLogin(@Req() req, @Res() res, @Body(new ValidationPipe()) body: PasswordLessDto) {
    Logger.log(`AuthController.loginWithMagicLogin(${body.destination})`);
    try {
      let loginResult;
      await getDataSource(async (dataSource) => {
        await dataSource.transaction(async (manager) => {
          return await this.authService.passportLogin(manager, req.body.destination);
        });
        loginResult = await this.strategy.send(req, res);
      });
      return loginResult;
    } catch (err) {
      res.status(err.status).send({ success: false, message: err.message });
    }
  }

  @UseGuards(AuthGuard('magiclogin'))
  @Get('login/callback')
  async callback(@Req() req) {
    return {
      "access_token": req.user,
    };
  }

  @Get('google/callback')
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    Logger.log(`AuthController.googleAuthCallback(${req.user})`);
    try {
      let token;
      await getDataSource(async (dataSource) => {
          token = await dataSource.transaction(async (manager) => {
            return await this.authService.oAuthLogin(manager, req.user);
          });
      });
      res.redirect(`${process.env.FRONTEND_URL}/oauth?token=${token.jwt}`);
    } catch (err) {
      res.status(500).send({ success: false, message: err.message });
    }
  }
}
