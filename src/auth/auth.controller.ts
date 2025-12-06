import {
    Body,
    Controller,
    Get,
    Logger,
    Post,
    Req,
    Res,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { getDataSource } from '../datasource.wrapper';
import { AuthService } from './auth.service';
import { PasswordLessDto } from './dtos/passwordless.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @UseGuards(AuthGuard('magiclogin'))
  @Post('login')
  async loginWithMagicLogin(
    @Req() req,
    @Res() res,
    @Body(new ValidationPipe()) body: PasswordLessDto,
  ) {
    Logger.log(`AuthController.loginWithMagicLogin(${body.destination})`);
    // The guard handles the token sending.
    // We just return success.
    res.send({ success: true });
  }

  @UseGuards(AuthGuard('magiclogin'))
  @Get('login/callback')
  async callback(@Req() req) {
    return {
      access_token: req.user,
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
